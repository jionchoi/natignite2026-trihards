import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { FixtureTypeSchema, RoomLayoutSchema } from "@/lib/schemas";
import { summarizeLayoutForPrompt } from "@/lib/scenePlacement";
import { parseGeminiJson } from "@/lib/parseGeminiJson";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  // Effective layout the user is seeing in unscaled (real-meter) coords.
  layout: RoomLayoutSchema,
});

const AddOpSchema = z.object({
  op: z.literal("add"),
  fixture: z.object({
    type: FixtureTypeSchema,
    label: z.string().optional(),
    position: z.tuple([z.number(), z.number(), z.number()]),
    size: z.tuple([
      z.number().positive(),
      z.number().positive(),
      z.number().positive(),
    ]),
    rotationY: z.number().default(0),
  }),
});

const OpsSchema = z.object({
  ops: z.array(AddOpSchema).min(1).max(6),
});

const SYSTEM = `You edit a 3D accessibility scene by emitting structured ops.

Coordinate system:
- Real-world meters. xz is the floor plane (y up).
- Each fixture has: id, type, label?, position (CENTER of bounding box [x,y,z]), size [width, height, depth], rotationY (radians, 0 = facing +z).
- Floor-resting fixtures have y = size.height / 2 so the bottom rests on y=0.
- A fixture's "forward" unit vector is [sin(rotationY), 0, cos(rotationY)]. "Behind" is the negative.

You ONLY support the "add" op right now. Each new fixture must specify type, position, size, rotationY (0 if unsure), optional label.

The renderer ONLY draws detailed geometry for these types — anything else falls back to a plain box. ALWAYS pick the closest type below; reserve "other" for genuinely generic objects.

Type vocabulary (with how to size for the realistic look):
- door: hinged door with handle. Wall-thin. Default [0.9, 2.05, 0.05].
- toilet: bowl + tank + flush button. Default [0.5, 0.65, 0.7].
- sink: counter slab + basin + faucet. Default [0.6, 0.85, 0.5].
- grab_bar: horizontal mounted bar. Default [0.6, 0.05, 0.05]. y ≈ 1.0.
- signage: thin plate on a post. Default [0.4, 0.6, 0.05].
- seating: bench OR chair — depends on HEIGHT.
    * BENCH look (no backrest, just a slab): height ≤ 0.55. Default [1.2, 0.45, 0.5].
    * CHAIR look (slab + backrest + four legs): height > 0.55. Default [0.55, 0.9, 0.55].
    * Use the chair sizing whenever the user says "chair", "stool", "armchair", "office chair", etc. Use the bench sizing for "bench", "couch", "settee", "pew", "long seat".
- counter: cabinet body + dark countertop + toe-kick. Default [1.2, 0.9, 0.6]. Use for "counter", "vanity", "reception desk", "front desk".
- column: cylindrical pillar with base/capital plates. Default [0.3, 2.7, 0.3].
- ramp: triangular ramp prism. Default [1.5, 0.15, 1.2].
- step: stairs (multiple treads, stepped silhouette). Default [1.0, h, 0.4] with height the total rise.
- obstacle: hazard-striped emissive block. Use for cones, spills, debris, clutter.
- other: plain box. Only use when nothing above fits.

Mapping common user words → type:
- "chair" / "stool" / "armchair" → seating with height > 0.55
- "bench" / "couch" / "settee" → seating with height ≤ 0.55
- "table" / "desk" / "vanity" / "reception" → counter
- "pillar" / "post" → column
- "sign" / "wayfinding" → signage
- "stairs" / "steps" → step
- "rail" / "handrail" / "grab bar" → grab_bar
- "door" / "doorway" → door
- "trash can" / "bin" / "planter" / "lamp" / "trolley" → other (no detailed mesh exists)

Position rules:
- Floor items (everything except grab_bar): y = size.height / 2.
- grab_bar: y ≈ 1.0 (mounted height).
- "in front of X": new.position = X.position + forward(X) * (X.size.depth/2 + new.size.depth/2 + 0.1)
- "behind X": same formula with -forward(X).
- "next to X" / "beside X": offset along X's right vector [cos(rotationY), 0, -sin(rotationY)].
- Match the new fixture's rotationY to the referenced fixture's rotationY unless the user requests otherwise (e.g. a ramp facing the seating means ramp.rotationY = seating.rotationY + π).
- Keep additions inside the floor polygon when possible.

Reference existing fixtures by their LABEL or TYPE in the user's prompt. If multiple match, pick the closest reasonable interpretation.

Return JSON only. Shape: {"ops":[{"op":"add","fixture":{"type":"ramp","label":"Ramp","position":[1.2,0.075,0.8],"size":[1.5,0.15,1.2],"rotationY":0}}]}`;

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

  const { prompt, layout } = body;
  const layoutSummary = summarizeLayoutForPrompt(layout);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.25,
      // Gemini 2.5 Flash spends a chunk of the output budget on "thinking"
      // tokens before emitting the JSON, so 1024 truncates the actual reply.
      // Match scene-suggestions and give it room to finish.
      maxOutputTokens: 4096,
    },
  });

  const userText = [
    layoutSummary,
    `User request: ${prompt.trim()}`,
    'Return JSON with shape {"ops":[{"op":"add","fixture":{...}}]} — at most 4 ops.',
  ].join("\n\n");

  let rawText = "";
  try {
    const result = await model.generateContent(userText);
    rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);
    const validated = OpsSchema.parse(parsed);

    // Stamp ids on the server so the client can dedupe and reference them.
    const stamped = validated.ops.map((o, i) => ({
      ...o,
      fixture: {
        ...o.fixture,
        id: `edit-${o.fixture.type}-${Date.now().toString(36)}-${i}`,
      },
    }));

    return NextResponse.json({ ops: stamped });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error("scene-edit failed:", errMessage);
    console.error("raw (first 1500 chars):", rawText.slice(0, 1500));
    return NextResponse.json(
      {
        error: "Edit failed",
        details: errMessage,
        rawPreview: rawText.slice(0, 600),
      },
      { status: 500 },
    );
  }
}
