import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import {
  ONLINE_ASSET_KEYS,
  glbUrlForAssetKey,
} from "@/lib/onlineModelRegistry";
import type { SceneSuggestionItem } from "@/lib/sceneSuggestions";
import {
  nudgeAwayFromFixtures,
  summarizeLayoutForPrompt,
} from "@/lib/scenePlacement";
import { RoomLayoutSchema } from "@/lib/schemas";
import { parseGeminiJson } from "@/lib/parseGeminiJson";

/** Accept common alternate shapes after JSON.parse (Gemini often omits `items` or nests arrays). */
function coerceSuggestionsPayload(parsedRaw: unknown): Record<string, unknown> {
  if (Array.isArray(parsedRaw)) return { items: parsedRaw };

  if (!parsedRaw || typeof parsedRaw !== "object") {
    return { items: [] };
  }

  const o = parsedRaw as Record<string, unknown>;

  const maybeDecodeItemsArray = (v: unknown): unknown[] | null => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try {
        const inner = JSON.parse(v);
        return Array.isArray(inner) ? inner : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  if ("items" in o) {
    const decoded = maybeDecodeItemsArray(o.items);
    if (decoded !== null) return { items: decoded };
  }

  const KEY_CANDIDATES = [
    "suggestions",
    "placements",
    "props",
    "results",
    "objects",
    "furniture",
    "placementSuggestions",
    "suggestedItems",
    "scene_items",
    "sceneSuggestions",
    "to_place",
    "models",
  ] as const;

  for (const key of KEY_CANDIDATES) {
    const decoded = maybeDecodeItemsArray(o[key]);
    if (decoded && decoded.length > 0) return { items: decoded };
  }

  // Nested wrappers: { data: { items: [...] } }, { response: { suggestions: [...] } }, etc.
  const WRAPPER_KEYS = ["data", "response", "result", "payload", "output"] as const;
  for (const w of WRAPPER_KEYS) {
    const inner = o[w];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const nested = coerceSuggestionsPayload(inner);
      if (Array.isArray(nested.items) && nested.items.length > 0) return nested;
    }
  }

  // First top-level array whose elements look like objects (not primitives)
  for (const v of Object.values(o)) {
    if (
      Array.isArray(v) &&
      v.length > 0 &&
      typeof v[0] === "object" &&
      v[0] !== null &&
      !Array.isArray(v[0])
    ) {
      return { items: v };
    }
  }

  // Single suggestion object
  if (
    Array.isArray(o.position) ||
    typeof o.assetKey === "string" ||
    typeof o.label === "string"
  ) {
    return { items: [o] };
  }

  return { ...o, items: maybeDecodeItemsArray(o.items) ?? [] };
}

export const runtime = "nodejs";
export const maxDuration = 45;

const RequestSchema = z.object({
  layout: RoomLayoutSchema,
  /** Short accessibility context for smarter props */
  overview: z.string().optional(),
});

const SuggestionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  reason: z.string(),
  assetKey: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  size: z.tuple([
    z.number().positive(),
    z.number().positive(),
    z.number().positive(),
  ]),
  rotationY: z.number(),
});

const SuggestionsSchema = z.object({
  items: z.array(SuggestionItemSchema).min(1).max(8),
});

const SYSTEM = `You suggest realistic props to add to an accessibility floor plan preview (restrooms, lobbies, corridors).
Each suggestion must use assetKey EXACTLY one of these keys (they map to downloadable GLB models online):
${ONLINE_ASSET_KEYS.join(", ")}

Rules:
- Pick 4–6 items unless the room is tiny (then 3–4).
- Choose props that plausibly improve comfort, safety, or clarity (seating near waits, lighting, carts for supplies, signage-friendly stands, plants for spatial calming — interpreted via available asset metaphors).
- Positions use the SAME coordinate system as the prompt: meters, xz floor plane, y up. position is the BOUNDING BOX CENTER. For floor-sitting objects, set y to half the height so the bottom rests on y=0.
- rotationY is radians (0 = +z forward).
- size is approximate footprint [width, height, depth] in meters for collision hints.
- Stay inside the floor polygon. Avoid overlapping existing fixture centers (already described).
- ids: short kebab-case unique strings.
You MUST return a single JSON object with a top-level array field named exactly "items" (never omit it). Example: {"items":[...]}.
Output valid JSON only, no markdown.`;

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GOOGLE_API_KEY. See .env.local.example." },
      { status: 500 },
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: String(err) },
      { status: 400 },
    );
  }

  const { layout, overview } = body;
  const layoutSummary = summarizeLayoutForPrompt(layout);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
      maxOutputTokens: 4096,
    },
  });

  const userText = [
    overview?.trim()
      ? `Space overview (from analysis): ${overview.trim()}`
      : null,
    layoutSummary,
    `Respond with JSON only. Required shape: an object with key "items" whose value is the array (never use another top-level key for the list). Example: {"items":[{"id":"bench-a","label":"Short label","reason":"Why this helps accessibility","assetKey":"seating_chair","position":[1.2,0.4,-0.5],"size":[0.6,0.8,0.55],"rotationY":0}]}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let rawText = "";
  try {
    const result = await model.generateContent(userText);
    rawText = result.response.text();
    const parsedRaw = parseGeminiJson(rawText);
    const payload = coerceSuggestionsPayload(parsedRaw);
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      const keys =
        parsedRaw && typeof parsedRaw === "object" && !Array.isArray(parsedRaw)
          ? Object.keys(parsedRaw as object).join(", ")
          : "(non-object)";
      throw new Error(
        `Model JSON must include a non-empty "items" array. Top-level keys seen: ${keys}`,
      );
    }
    const validated = SuggestionsSchema.parse(payload);
    const slice = validated.items.slice(0, 6);

    const poly = layout.floor.polygon as [number, number][];
    const placed: SceneSuggestionItem[] = [];

    for (const item of slice) {
      let assetKey = item.assetKey;
      if (!glbUrlForAssetKey(assetKey)) {
        assetKey = "generic_box";
      }
      const glbUrl = glbUrlForAssetKey(assetKey)!;

      let [x, y, z] = item.position;
      const [nx, nz] = nudgeAwayFromFixtures(x, z, layout.fixtures, poly);
      x = nx;
      z = nz;

      placed.push({
        ...item,
        assetKey,
        position: [x, y, z],
        glbUrl,
      });
    }

    return NextResponse.json({ items: placed });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error("scene-suggestions failed:", errMessage);
    console.error("raw (first 2000 chars):", rawText.slice(0, 2000));
    return NextResponse.json(
      {
        error: "Suggestion failed",
        details: errMessage,
        rawPreview: rawText.slice(0, 900),
      },
      { status: 500 },
    );
  }
}
