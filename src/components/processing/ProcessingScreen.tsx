"use client";

import dynamic from "next/dynamic";
import { type StageId } from "@/components/upload/UploadStepper";

const SceneLoadingScreen = dynamic(
  () =>
    import("./SceneLoadingScreen").then((m) => m.SceneLoadingScreen),
  { ssr: false },
);

interface ProcessingScreenProps {
  stage: StageId;
  message?: string;
}

export function ProcessingScreen({ stage, message }: ProcessingScreenProps) {
  const fallbackMessage =
    message ??
    (stage === "depth"
      ? "Building 3D view in your browser. First load may take ~30s while the depth model downloads."
      : "Reviewing accessibility…");

  return <SceneLoadingScreen message={fallbackMessage} />;
}
