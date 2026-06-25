"use client";

/**
 * Produces a depth-map data URL for an image.
 *
 * Strategy: hit the hosted Replicate model first (lightweight on the client —
 * nothing to download, works on phones). If that route is unavailable, not
 * configured, or errors, transparently fall back to the local in-browser
 * Depth-Anything model so the app keeps working offline / without an API key.
 */
export async function getDepthDataUrl(imageDataUrl: string): Promise<string> {
  try {
    const res = await fetch("/api/depth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl }),
    });

    if (res.ok) {
      const data = (await res.json()) as { dataUrl?: string };
      if (data.dataUrl) return data.dataUrl;
    }
    // Non-OK (e.g. 501 not configured / 502 provider error) → fall through.
    console.warn("Remote depth unavailable, falling back to local model.");
  } catch (err) {
    console.warn("Remote depth request failed, falling back to local model.", err);
  }

  const { estimateDepth } = await import("@/lib/depth");
  const result = await estimateDepth(imageDataUrl);
  return result.dataUrl;
}
