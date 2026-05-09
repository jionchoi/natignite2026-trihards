"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, type Texture } from "three";

export type DepthSampler = (u: number, v: number) => number;

export interface MeshGeometryInfo {
  colorMap: Texture;
  depthMap: Texture;
  width: number;
  height: number;
  sampleDepth: DepthSampler | null;
}

// Loads the color + depth textures and derives the planar dimensions plus a
// CPU bilinear depth sampler. Shared between the 3D mesh and the pin overlay
// so they agree on geometry and surface depth at every (u, v) pixel.
export function useMeshGeometry(
  imageUrl: string,
  depthUrl: string,
): MeshGeometryInfo {
  const colorMap = useLoader(TextureLoader, imageUrl);
  const depthMap = useLoader(TextureLoader, depthUrl);

  const { width, height } = useMemo(() => {
    const img = colorMap.image as HTMLImageElement | undefined;
    if (!img) return { width: 1.6, height: 1 };
    const aspect = img.width / img.height;
    return aspect >= 1
      ? { width: 1.6, height: 1.6 / aspect }
      : { width: aspect, height: 1 };
  }, [colorMap]);

  const sampleDepth = useMemo<DepthSampler | null>(() => {
    const img = depthMap.image as HTMLImageElement | undefined;
    if (!img || !img.width || !img.height) return null;
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const W = img.width;
    const H = img.height;
    return (u: number, v: number) => {
      const cu = u < 0 ? 0 : u > 1 ? 1 : u;
      const cv = v < 0 ? 0 : v > 1 ? 1 : v;
      const xf = cu * (W - 1);
      // flipY=true is the three.js default — UV.v=1 maps to image row 0 (top).
      const yf = (1 - cv) * (H - 1);
      const x0 = Math.floor(xf);
      const y0 = Math.floor(yf);
      const x1 = x0 + 1 < W ? x0 + 1 : x0;
      const y1 = y0 + 1 < H ? y0 + 1 : y0;
      const fx = xf - x0;
      const fy = yf - y0;
      const v00 = data[(y0 * W + x0) * 4] / 255;
      const v10 = data[(y0 * W + x1) * 4] / 255;
      const v01 = data[(y1 * W + x0) * 4] / 255;
      const v11 = data[(y1 * W + x1) * 4] / 255;
      return (
        v00 * (1 - fx) * (1 - fy) +
        v10 * fx * (1 - fy) +
        v01 * (1 - fx) * fy +
        v11 * fx * fy
      );
    };
  }, [depthMap]);

  return { colorMap, depthMap, width, height, sampleDepth };
}
