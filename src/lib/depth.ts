"use client";

import { pipeline, RawImage, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = "onnx-community/depth-anything-v2-small";

let pipePromise: Promise<any> | null = null;

function getPipeline(): Promise<any> {
  if (!pipePromise) {
    pipePromise = (async () => {
      try {
        return await pipeline("depth-estimation", MODEL_ID, {
          device: "webgpu",
          dtype: "fp32",
        } as any);
      } catch {
        return await pipeline("depth-estimation", MODEL_ID);
      }
    })();
  }
  return pipePromise;
}

export interface DepthResult {
  dataUrl: string;
  width: number;
  height: number;
}

export async function estimateDepth(imageDataUrl: string): Promise<DepthResult> {
  const pipe = await getPipeline();
  const image = await RawImage.fromURL(imageDataUrl);
  const out: any = await pipe(image);
  const depth = out.depth ?? out[0]?.depth;
  if (!depth) throw new Error("Depth pipeline returned no depth tensor");

  const canvas = rawImageToCanvas(depth);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

function rawImageToCanvas(raw: any): HTMLCanvasElement {
  const width: number = raw.width;
  const height: number = raw.height;
  const channels: number = raw.channels ?? 1;
  const data: Uint8ClampedArray | Uint8Array = raw.data;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  const imageData = ctx.createImageData(width, height);
  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    const v = data[i];
    imageData.data[j] = v;
    imageData.data[j + 1] = v;
    imageData.data[j + 2] = v;
    imageData.data[j + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
