"use client";

import JSZip from "jszip";
import * as THREE from "three";
import { useSession } from "@/lib/store";
import { generateMarkdownReport } from "@/lib/report";
import { meshToOBJ } from "./objExporter";

type MeshRef = Readonly<{ current: THREE.Mesh | null }>;
const MAX_TEXTURE_BYTES = 4 * 1024 * 1024;

interface MeshSegments {
  x: number;
  y: number;
}

interface MeshManifest {
  accessifyVersion: "1.0";
  bundleType: "mesh";
  exportedAt: string;
  sessionId: string;
  spaceType: string;
  notes?: string;
  imageWidth: number;
  imageHeight: number;
  depthModelId: string;
  geminiModel: string;
  meshSegmentsX: number;
  meshSegmentsY: number;
  files: {
    texture: string;
    depth: string;
    obj: string;
    mtl: string;
    analysis: string;
    report: string;
  };
}

export async function exportMeshBundle(
  meshRef: MeshRef,
  fallbackSegments: MeshSegments = { x: 384, y: 384 },
): Promise<void> {
  const store = useSession.getState();
  const {
    id,
    imageDataUrl,
    imageWidth,
    imageHeight,
    depthDataUrl,
    analysis,
    context,
  } = store;

  if (!id || !analysis || !imageDataUrl || !depthDataUrl) {
    throw new Error("Analysis is not complete. Export is available after the 3D view loads.");
  }

  store.resetExport();
  store.setExportStage("preparing");
  store.setExportProgress(0.05);

  const zip = new JSZip();

  const textureBlob = await dataUrlToBlob(imageDataUrl, "image/jpeg", 0.9);
  zip.file("texture.jpg", textureBlob);
  store.setExportProgress(0.22);

  const depthBlob = await dataUrlToBlob(depthDataUrl, "image/png");
  zip.file("depth.png", depthBlob);
  store.setExportProgress(0.34);

  const mesh = meshRef.current;
  const segments = getMeshSegments(mesh, fallbackSegments);
  if (mesh) {
    const { obj, mtl } = meshToOBJ(mesh, {
      materialName: "accessify_mat",
      textureName: "texture.jpg",
      objectName: "AccessifyMesh",
      mtllibName: "model.mtl",
    });
    zip.file("model.obj", obj);
    zip.file("model.mtl", mtl);
  } else {
    zip.file("model.obj", "# Mesh reference unavailable at export time\n");
    zip.file("model.mtl", "");
  }
  store.setExportProgress(0.55);

  zip.file("analysis.json", JSON.stringify(analysis, null, 2));
  store.setExportProgress(0.65);

  const reportMd = generateMarkdownReport({
    analysis,
    spaceType: context.spaceType,
    notes: context.notes,
  });
  zip.file("report.md", reportMd);
  store.setExportProgress(0.74);

  const manifest: MeshManifest = {
    accessifyVersion: "1.0",
    bundleType: "mesh",
    exportedAt: new Date().toISOString(),
    sessionId: id,
    spaceType: context.spaceType,
    notes: context.notes || undefined,
    imageWidth,
    imageHeight,
    depthModelId: "onnx-community/depth-anything-v2-small",
    geminiModel: "gemini-2.5-flash",
    meshSegmentsX: segments.x,
    meshSegmentsY: segments.y,
    files: {
      texture: "texture.jpg",
      depth: "depth.png",
      obj: "model.obj",
      mtl: "model.mtl",
      analysis: "analysis.json",
      report: "report.md",
    },
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("README.txt", meshBundleReadme(manifest));
  store.setExportProgress(0.84);

  store.setExportStage("zipping");
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => {
      store.setExportProgress(0.84 + (meta.percent / 100) * 0.15);
    },
  );

  store.setExportProgress(1);
  store.setExportStage("done");
  triggerDownload(blob, `accessify-mesh-${id.slice(0, 8)}.zip`);
  window.setTimeout(() => useSession.getState().resetExport(), 2500);
}

async function dataUrlToBlob(
  dataUrl: string,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  if (quality !== undefined && mimeType === "image/jpeg") {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image canvas for export.");
    ctx.drawImage(img, 0, 0);
    const qualities = [quality, 0.82, 0.74, 0.66, 0.58, 0.5];
    let workingCanvas = canvas;
    let latest: Blob | null = null;
    for (let pass = 0; pass < 5; pass++) {
      for (const q of qualities) {
        latest = await canvasToBlob(workingCanvas, mimeType, q);
        if (latest.size <= MAX_TEXTURE_BYTES) return latest;
      }
      if (!latest || workingCanvas.width < 480 || workingCanvas.height < 480) {
        break;
      }
      const scale = Math.max(
        0.5,
        Math.min(0.9, Math.sqrt(MAX_TEXTURE_BYTES / latest.size) * 0.92),
      );
      workingCanvas = resizeCanvas(workingCanvas, scale);
    }
    if (latest && latest.size <= MAX_TEXTURE_BYTES) return latest;
    throw new Error("Could not encode texture.jpg.");
  }

  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid data URL in session.");
  const header = dataUrl.slice(0, commaIdx);
  const base64 = dataUrl.slice(commaIdx + 1);
  const detectedMime = /^data:([^;]+);base64$/.exec(header)?.[1] ?? mimeType;
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: detectedMime });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode texture.jpg."))),
      mimeType,
      quality,
    );
  });
}

function resizeCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const next = document.createElement("canvas");
  next.width = Math.max(1, Math.round(source.width * scale));
  next.height = Math.max(1, Math.round(source.height * scale));
  const ctx = next.getContext("2d");
  if (!ctx) throw new Error("Could not resize texture for export.");
  ctx.drawImage(source, 0, 0, next.width, next.height);
  return next;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load session image for export."));
    img.src = src;
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function getMeshSegments(mesh: THREE.Mesh | null, fallback: MeshSegments): MeshSegments {
  const raw = mesh?.userData.accessifySegments as Partial<MeshSegments> | undefined;
  const x = typeof raw?.x === "number" ? raw.x : fallback.x;
  const y = typeof raw?.y === "number" ? raw.y : fallback.y;
  return { x, y };
}

function meshBundleReadme(manifest: MeshManifest): string {
  return `ACCESSIFY MESH BUNDLE
=====================
Bundle type : Mesh
Exported at : ${manifest.exportedAt}
Session ID  : ${manifest.sessionId}
Space type  : ${manifest.spaceType}

FILES
-----
texture.jpg    Original uploaded photo, re-encoded as JPEG
depth.png      Depth map produced by ${manifest.depthModelId}
model.obj      3D displaced mesh in Wavefront OBJ format
model.mtl      Material definition referencing texture.jpg
analysis.json  Full accessibility analysis JSON
report.md      Human-readable accessibility report
manifest.json  Bundle metadata

IMPORTING
---------
Open Accessify, click Import / Export, then choose Import and select this ZIP.
The analysis session will load without re-running the AI or depth model.

DISCLAIMER
----------
This analysis is AI-generated and should be verified by a qualified
accessibility consultant before making accessibility decisions.
`;
}
