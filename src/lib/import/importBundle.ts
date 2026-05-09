"use client";

import JSZip from "jszip";
import { useSession } from "@/lib/store";
import {
  AnalysisSchema,
  RoomLayoutSchema,
  type Analysis,
} from "@/lib/schemas";
import { generateId } from "@/lib/image";
import type { ContextValue } from "@/components/upload/ContextForm";

export type BundleType = "mesh" | "scene";

export interface ImportResult {
  bundleType: BundleType;
  sessionId: string;
}

interface BundleManifest {
  accessifyVersion?: unknown;
  bundleType?: unknown;
  sessionId?: unknown;
  spaceType?: unknown;
  notes?: unknown;
  imageWidth?: unknown;
  imageHeight?: unknown;
  files?: Partial<Record<string, unknown>>;
}

const SPACE_TYPES: ContextValue["spaceType"][] = [
  "cafe",
  "restaurant",
  "office",
  "retail",
  "venue",
  "hotel",
  "public",
  "other",
];

export async function importBundle(file: File): Promise<ImportResult> {
  const store = useSession.getState();

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("Could not read this ZIP file. Choose a valid Accessify bundle.");
  }

  const manifest = await readManifest(zip);
  const bundleType = readBundleType(manifest);
  const files =
    manifest.files && typeof manifest.files === "object"
      ? manifest.files
      : {};

  const analysisName = asFileName(files.analysis) ?? "analysis.json";
  const analysis = await readAnalysis(zip, analysisName, bundleType, files);

  let imageDataUrl: string | null = null;
  let depthDataUrl: string | null = null;

  if (bundleType === "mesh") {
    const textureName = asFileName(files.texture) ?? "texture.jpg";
    const depthName = asFileName(files.depth) ?? "depth.png";
    const textureFile = zip.file(textureName);
    if (!textureFile) throw new Error(`Missing ${textureName} in mesh bundle.`);
    const depthFile = zip.file(depthName);
    if (!depthFile) throw new Error(`Missing ${depthName} in mesh bundle.`);

    imageDataUrl = uint8ToDataUrl(await textureFile.async("uint8array"), "image/jpeg");
    depthDataUrl = uint8ToDataUrl(await depthFile.async("uint8array"), "image/png");
  }

  const sessionId = typeof manifest.sessionId === "string"
    ? manifest.sessionId
    : safeRandomId();
  const imageWidth = typeof manifest.imageWidth === "number" ? manifest.imageWidth : 0;
  const imageHeight = typeof manifest.imageHeight === "number" ? manifest.imageHeight : 0;
  const notes = typeof manifest.notes === "string" ? manifest.notes : "";

  store.hydrateFromBundle({
    id: sessionId,
    imageDataUrl,
    imageWidth,
    imageHeight,
    depthDataUrl,
    analysis,
    spaceType: readSpaceType(manifest.spaceType),
    notes,
    importSource: "file",
    stage: "done",
  });

  return { bundleType, sessionId };
}

async function readManifest(zip: JSZip): Promise<BundleManifest> {
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Missing manifest.json. This does not appear to be an Accessify bundle.");
  }

  let manifest: BundleManifest;
  try {
    manifest = JSON.parse(await manifestFile.async("string")) as BundleManifest;
  } catch {
    throw new Error("manifest.json is not valid JSON.");
  }

  if (manifest.accessifyVersion !== "1.0") {
    throw new Error(`Unsupported Accessify bundle version: ${String(manifest.accessifyVersion)}.`);
  }

  return manifest;
}

function readBundleType(manifest: BundleManifest): BundleType {
  if (manifest.bundleType === "mesh" || manifest.bundleType === "scene") {
    return manifest.bundleType;
  }
  throw new Error(`Unknown Accessify bundle type: ${String(manifest.bundleType)}.`);
}

async function readAnalysis(
  zip: JSZip,
  analysisName: string,
  bundleType: BundleType,
  files: Partial<Record<string, unknown>>,
): Promise<Analysis> {
  const analysisFile = zip.file(analysisName);
  if (!analysisFile) throw new Error(`Missing ${analysisName} in bundle.`);

  let rawAnalysis: unknown;
  try {
    rawAnalysis = JSON.parse(await analysisFile.async("string"));
  } catch {
    throw new Error(`${analysisName} is not valid JSON.`);
  }

  let analysis: Analysis;
  try {
    analysis = AnalysisSchema.parse(rawAnalysis);
  } catch (error) {
    throw new Error(`analysis.json failed validation: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (bundleType === "scene" && !analysis.roomLayout) {
    const roomLayoutName = asFileName(files.roomLayout) ?? "room-layout.json";
    const layoutFile = zip.file(roomLayoutName);
    if (!layoutFile) throw new Error(`Missing ${roomLayoutName} in scene bundle.`);
    try {
      const roomLayout = RoomLayoutSchema.parse(
        JSON.parse(await layoutFile.async("string")),
      );
      analysis = { ...analysis, roomLayout };
    } catch (error) {
      throw new Error(`room-layout.json failed validation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return analysis;
}

function readSpaceType(value: unknown): ContextValue["spaceType"] {
  return typeof value === "string" &&
    (SPACE_TYPES as readonly string[]).includes(value)
    ? (value as ContextValue["spaceType"])
    : "other";
}

function asFileName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function safeRandomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? generateId();
}

function uint8ToDataUrl(bytes: Uint8Array, mimeType: string): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length))),
    );
  }
  return `data:${mimeType};base64,${window.btoa(chunks.join(""))}`;
}
