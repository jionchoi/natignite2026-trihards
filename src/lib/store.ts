"use client";

import { create } from "zustand";
import type { Analysis } from "./schemas";
import type { ContextValue } from "@/components/upload/ContextForm";
import { CATEGORIES } from "./categories";

export type StageId = "upload" | "depth" | "analyze" | "done";
export type ImportSource = "none" | "file";
export type ExportStage = "idle" | "preparing" | "zipping" | "done" | "error";

export interface BundleHydrationPayload {
  id: string;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  depthDataUrl: string | null;
  analysis: Analysis;
  spaceType: ContextValue["spaceType"];
  notes?: string;
  importSource: "file";
  stage: "done";
}

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
  importSource: ImportSource;
  exportStage: ExportStage;
  exportProgress: number;
  exportError: string | null;

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
  setImportSource: (source: ImportSource) => void;
  setExportStage: (stage: ExportStage) => void;
  setExportProgress: (progress: number) => void;
  setExportError: (error: string | null) => void;
  resetExport: () => void;
  hydrateFromBundle: (payload: BundleHydrationPayload) => void;
  reset: () => void;
}

const initialContext: ContextValue = {
  spaceType: "cafe",
  notes: "",
  focusCategories: [...CATEGORIES],
  otherFocus: "",
};

export const useSession = create<SessionState>((set, get) => ({
  id: null,
  imageDataUrl: null,
  imageWidth: 0,
  imageHeight: 0,
  context: initialContext,
  depthDataUrl: null,
  analysis: null,
  stage: "upload",
  error: null,
  importSource: "none",
  exportStage: "idle",
  exportProgress: 0,
  exportError: null,

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
      importSource: "none",
      exportStage: "idle",
      exportProgress: 0,
      exportError: null,
    }),
  setStage: (stage) => set({ stage }),
  setDepth: (dataUrl) => set({ depthDataUrl: dataUrl }),
  setAnalysis: (analysis) => set({ analysis }),
  setError: (msg) => set({ error: msg }),
  setImportSource: (source) => set({ importSource: source }),
  setExportStage: (stage) => set({ exportStage: stage }),
  setExportProgress: (progress) =>
    set({ exportProgress: Math.max(0, Math.min(1, progress)) }),
  setExportError: (error) => set({ exportError: error }),
  resetExport: () =>
    set({ exportStage: "idle", exportProgress: 0, exportError: null }),
  hydrateFromBundle: (payload) =>
    set({
      id: payload.id,
      imageDataUrl: payload.imageDataUrl,
      imageWidth: payload.imageWidth,
      imageHeight: payload.imageHeight,
      context: {
        ...get().context,
        spaceType: payload.spaceType,
        notes: payload.notes ?? "",
      },
      depthDataUrl: payload.depthDataUrl,
      analysis: payload.analysis,
      stage: payload.stage,
      error: null,
      importSource: payload.importSource,
      exportStage: "idle",
      exportProgress: 0,
      exportError: null,
    }),
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
      importSource: "none",
      exportStage: "idle",
      exportProgress: 0,
      exportError: null,
    }),
}));
