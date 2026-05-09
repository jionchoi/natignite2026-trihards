"use client";

import { create } from "zustand";
import type { Analysis } from "./schemas";
import type { ContextValue } from "@/components/upload/ContextForm";

export type StageId = "upload" | "depth" | "analyze" | "done";

interface SessionState {
  id: string | null;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  context: ContextValue;
  depthDataUrl: string | null;
  analysis: Analysis | null;
  stage: StageId;
  error: string | null;

  startSession: (input: {
    id: string;
    imageDataUrl: string;
    width: number;
    height: number;
    context: ContextValue;
  }) => void;
  setStage: (stage: StageId) => void;
  setDepth: (dataUrl: string) => void;
  setAnalysis: (analysis: Analysis) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initialContext: ContextValue = { spaceType: "cafe", notes: "" };

export const useSession = create<SessionState>((set) => ({
  id: null,
  imageDataUrl: null,
  imageWidth: 0,
  imageHeight: 0,
  context: initialContext,
  depthDataUrl: null,
  analysis: null,
  stage: "upload",
  error: null,

  startSession: ({ id, imageDataUrl, width, height, context }) =>
    set({
      id,
      imageDataUrl,
      imageWidth: width,
      imageHeight: height,
      context,
      depthDataUrl: null,
      analysis: null,
      stage: "depth",
      error: null,
    }),
  setStage: (stage) => set({ stage }),
  setDepth: (dataUrl) => set({ depthDataUrl: dataUrl }),
  setAnalysis: (analysis) => set({ analysis }),
  setError: (msg) => set({ error: msg }),
  reset: () =>
    set({
      id: null,
      imageDataUrl: null,
      imageWidth: 0,
      imageHeight: 0,
      context: initialContext,
      depthDataUrl: null,
      analysis: null,
      stage: "upload",
      error: null,
    }),
}));
