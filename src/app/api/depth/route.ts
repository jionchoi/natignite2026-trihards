import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  imageDataUrl: z.string().startsWith("data:"),
});

// Replicate model that produces a depth map from an image. Override with
// REPLICATE_DEPTH_MODEL if you want a different one (e.g. a pinned version).
// Using the model-predictions endpoint runs the model's latest version, so we
// don't have to hard-code a version hash.
const DEFAULT_MODEL = "chenxwh/depth-anything-v2";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
  urls?: { get?: string };
};

function pickImageUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output.find((o) => typeof o === "string");
    return (first as string) ?? null;
  }
  // Some models return an object like { depth: "https://..." } or { grey_depth: "..." }.
  if (output && typeof output === "object") {
    for (const v of Object.values(output as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("http")) return v;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    // Signal "not configured" so the client falls back to the local model.
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set", fallback: true },
      { status: 501 },
    );
  }

  let body;
  try {
    body = RequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 },
    );
  }

  const model = process.env.REPLICATE_DEPTH_MODEL || DEFAULT_MODEL;

  try {
    // "Prefer: wait" makes Replicate hold the request open until the prediction
    // finishes (up to ~60s) so we usually avoid manual polling.
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${model}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({ input: { image: body.imageDataUrl } }),
      },
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      return NextResponse.json(
        { error: "Replicate request failed", details: text, fallback: true },
        { status: 502 },
      );
    }

    let prediction = (await createRes.json()) as ReplicatePrediction;

    // If it didn't finish during the held request, poll a few times.
    let attempts = 0;
    while (
      attempts < 20 &&
      (prediction.status === "starting" || prediction.status === "processing")
    ) {
      const getUrl = prediction.urls?.get;
      if (!getUrl) break;
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      prediction = (await pollRes.json()) as ReplicatePrediction;
      attempts += 1;
    }

    if (prediction.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Depth prediction did not succeed",
          details: prediction.error ?? prediction.status,
          fallback: true,
        },
        { status: 502 },
      );
    }

    const imageUrl = pickImageUrl(prediction.output);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No depth image in Replicate output", fallback: true },
        { status: 502 },
      );
    }

    // Fetch the produced depth image and return it as a data URL so the client
    // can use it exactly like the local model's output.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Failed to download depth image", fallback: true },
        { status: 502 },
      );
    }
    const contentType = imgRes.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Replicate depth failed -", message);
    return NextResponse.json(
      { error: "Depth request failed", details: message, fallback: true },
      { status: 502 },
    );
  }
}
