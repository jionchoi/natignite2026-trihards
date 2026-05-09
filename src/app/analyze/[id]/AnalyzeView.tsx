"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, RotateCcw, Box } from "lucide-react";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { AccessibilityReport } from "@/components/report/AccessibilityReport";
import { UploadStepper } from "@/components/upload/UploadStepper";
import { useSession } from "@/lib/store";
import { type Analysis } from "@/lib/schemas";
import { SEVERITY_RANK } from "@/lib/severity";

const MeshViewer = dynamic(
  () => import("@/components/viewer/MeshViewer").then((m) => m.MeshViewer),
  { ssr: false },
);

export function AnalyzeView() {
  const session = useSession();
  const startedRef = useRef(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Default-select the most severe pinned issue once analysis is available, so
  // the 3D pin's bubble and the 2D image's labeled dot both light up together.
  const pinnedIssues = useMemo(
    () => session.analysis?.issues.filter((i) => i.locationHint) ?? [],
    [session.analysis],
  );
  useEffect(() => {
    if (selectedIssueId && pinnedIssues.find((i) => i.id === selectedIssueId)) {
      return;
    }
    if (pinnedIssues.length === 0) {
      if (selectedIssueId !== null) setSelectedIssueId(null);
      return;
    }
    const mostSevere = [...pinnedIssues].sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    )[0];
    setSelectedIssueId(mostSevere?.id ?? null);
  }, [pinnedIssues, selectedIssueId]);

  useEffect(() => {
    if (!session.imageDataUrl || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        session.setStage("depth");
        const { estimateDepth } = await import("@/lib/depth");

        const [depthResult, analysis] = await Promise.all([
          estimateDepth(session.imageDataUrl!),
          (async () => {
            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageDataUrl: session.imageDataUrl,
                spaceType: session.context.spaceType,
                notes: session.context.notes,
              }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              const msg = body.details
                ? `${body.error ?? "Analysis failed"}: ${body.details}`
                : (body.error ?? "Analysis failed");
              throw new Error(msg);
            }
            return (await res.json()) as Analysis;
          })(),
        ]);

        session.setDepth(depthResult.dataUrl);
        session.setAnalysis(analysis);
        session.setStage("done");
      } catch (err) {
        console.error(err);
        session.setError(err instanceof Error ? err.message : String(err));
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.imageDataUrl]);

  if (!session.imageDataUrl) {
    return (
      <div className="frosted-glass rounded-2xl p-8 text-center animate-slide-in-up">
        <h2 className="text-lg font-semibold text-foreground">
          No session in progress
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a photo from the home page to start an analysis.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4" />
            Go to upload
          </Link>
        </div>
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="frosted-glass rounded-2xl p-8 text-center border-l-4 border-l-destructive animate-slide-in-up">
        <h2 className="text-lg font-semibold text-destructive">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{session.error}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  if (session.stage !== "done" || !session.analysis) {
    return (
      <ProcessingScreen
        stage={session.stage}
        message={
          session.depthDataUrl && !session.analysis
            ? "3D view ready. Finishing accessibility review…"
            : !session.depthDataUrl && session.analysis
              ? "Report ready. Finishing 3D view…"
              : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-slide-in-up">
      <div className="flex flex-col gap-2">
        <MeshViewer
          imageUrl={session.imageDataUrl}
          depthUrl={session.depthDataUrl}
          issues={session.analysis.issues}
          selectedIssueId={selectedIssueId}
          onSelectIssue={setSelectedIssueId}
          className="h-[80vh] min-h-[520px] w-full"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Drag to orbit · scroll to zoom · click a pin to read its issue.
          </p>
          {session.analysis.roomLayout ? (
            <Link
              href={`/analyze/${session.id}/scene`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
            >
              <Box className="w-3.5 h-3.5" />
              View procedural scene
            </Link>
          ) : null}
        </div>
      </div>

      <div className="frosted-glass rounded-2xl overflow-hidden h-[720px]">
        <AccessibilityReport
          imageUrl={session.imageDataUrl}
          analysis={session.analysis}
          spaceType={session.context.spaceType}
          notes={session.context.notes}
          selectedIssueId={selectedIssueId}
          onSelectIssue={setSelectedIssueId}
        />
      </div>

      <div className="frosted-glass rounded-2xl px-4 py-3">
        <UploadStepper current="done" />
      </div>

      <div className="flex justify-end">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
        >
          <RotateCcw className="w-4 h-4" />
          Analyze another photo
        </Link>
      </div>
    </div>
  );
}
