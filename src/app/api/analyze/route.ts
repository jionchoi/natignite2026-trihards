import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { AnalysisSchema } from "@/lib/schemas";
import { dataUrlToBase64 } from "@/lib/image";
import {
  ACCESSIBILITY_SYSTEM_PROMPT,
  buildUserPrompt,
} from "@/lib/prompts";
import { parseGeminiJson } from "@/lib/parseGeminiJson";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  imageDataUrl: z.string().startsWith("data:"),
  spaceType: z.string().min(1),
  notes: z.string().optional().default(""),
  focusCategories: z.array(z.string()).optional().default([]),
  otherFocus: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GOOGLE_API_KEY. See .env.local.example." },
      { status: 500 },
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

  const { imageDataUrl, spaceType, notes, focusCategories, otherFocus } = body;
  const { base64, mimeType } = dataUrlToBase64(imageDataUrl);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: ACCESSIBILITY_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  });

  let rawText = "";
  try {
    const result = await model.generateContent([
      { text: buildUserPrompt({ spaceType, notes, focusCategories, otherFocus }) },
      { inlineData: { data: base64, mimeType } },
    ]);
    rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);
    const validated = AnalysisSchema.parse(parsed);
    return NextResponse.json(validated);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error("Gemini analysis failed -", errMessage);
    if (errStack) console.error(errStack);
    console.error("Raw model output (first 4000 chars):");
    console.error(rawText.slice(0, 4000));
    console.error("Raw output total length:", rawText.length);
    return NextResponse.json(
      {
        error: "Analysis failed",
        details: errMessage,
        rawPreview: rawText.slice(0, 500),
        rawLength: rawText.length,
      },
      { status: 500 },
    );
  }
}
