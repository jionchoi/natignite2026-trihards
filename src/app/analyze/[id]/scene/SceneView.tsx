"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Box,
  FastForward,
  Loader2,
  Play,
  Send,
  Sparkles,
  Square,
  UserPlus,
  Wand2,
  X,
} from "lucide-react";
import { useSession } from "@/lib/store";
import {
  SimulationReports,
  type ReportLogEntry,
} from "@/components/viewer/SimulationReports";
import { type ReportEvent } from "@/components/viewer/AgentSimulation";
import { ALL_PERSONAS, type Persona } from "@/lib/personas";
import type { SceneSuggestionItem } from "@/lib/sceneSuggestions";
import type { Fixture } from "@/lib/schemas";

const BASE_SPEED = 0.6;
const SPEED_STEPS = [1, 2, 3, 4];

const SceneViewer = dynamic(
  () => import("@/components/viewer/SceneViewer").then((m) => m.SceneViewer),
  { ssr: false },
);

const MAX_REPORTS = 50;

export function SceneView() {
  const session = useSession();
  const layout = session.analysis?.roomLayout ?? null;
  const issues = session.analysis?.issues ?? [];

  const [simRunning, setSimRunning] = useState(false);
  const [reports, setReports] = useState<ReportLogEntry[]>([]);
  const [personas, setPersonas] = useState<Persona[]>(ALL_PERSONAS);
  const [speedStepIdx, setSpeedStepIdx] = useState(0);
  const [onlinePlacements, setOnlinePlacements] = useState<SceneSuggestionItem[]>(
    [],
  );
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Natural-language editor state — fixtures Gemini has appended in response
  // to the user's prompt, plus the input box and request lifecycle.
  const [extraFixtures, setExtraFixtures] = useState<Fixture[]>([]);
  const [editPrompt, setEditPrompt] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setOnlinePlacements([]);
    setSuggestError(null);
    setExtraFixtures([]);
    setEditError(null);
    setEditPrompt("");
  }, [session.id]);

  const addPerson = () => {
    setPersonas((prev) => {
      const next = ALL_PERSONAS[prev.length % ALL_PERSONAS.length];
      return [...prev, next];
    });
  };

  const cycleSpeed = () => {
    setSpeedStepIdx((i) => (i + 1) % SPEED_STEPS.length);
  };

  const speedMultiplier = SPEED_STEPS[speedStepIdx];

  const handleReport = useCallback((e: ReportEvent) => {
    setReports((prev) => {
      const idx = prev.findIndex(
        (r) => r.issueId === e.issueId && r.persona === e.persona,
      );
      if (idx >= 0) {
        // Same person hit the same barrier again — bump count, refresh
        // last-seen time, and float the entry to the top of the log.
        const existing = prev[idx];
        const updated: ReportLogEntry = {
          ...existing,
          count: existing.count + 1,
          lastTs: e.ts,
        };
        return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      const next: ReportLogEntry = {
        issueId: e.issueId,
        persona: e.persona,
        count: 1,
        firstTs: e.ts,
        lastTs: e.ts,
      };
      return [next, ...prev].slice(0, MAX_REPORTS);
    });
  }, []);

  const submitEdit = useCallback(async () => {
    if (!layout) return;
    const trimmed = editPrompt.trim();
    if (!trimmed) return;
    setEditLoading(true);
    setEditError(null);
    try {
      // Send the fixtures the user is currently looking at (originals + any
      // fixtures previously added via prompt) so Gemini can resolve "in front
      // of the seating" against the live state, not just the initial scan.
      const effectiveLayout = {
        ...layout,
        fixtures: [...layout.fixtures, ...extraFixtures],
      };
      const res = await fetch("/api/scene-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, layout: effectiveLayout }),
      });
      const data = (await res.json()) as {
        ops?: Array<{
          op: "add";
          fixture: Fixture;
        }>;
        error?: string;
        details?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.details || data.error || `Request failed (${res.status})`,
        );
      }
      const adds = (data.ops ?? [])
        .filter((o) => o.op === "add")
        .map((o) => o.fixture);
      if (!adds.length) {
        throw new Error("No changes were generated");
      }
      setExtraFixtures((prev) => [...prev, ...adds]);
      setEditPrompt("");
    } catch (e) {
      setEditError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditLoading(false);
    }
  }, [layout, editPrompt, extraFixtures]);

  const clearEdits = () => {
    setExtraFixtures([]);
    setEditError(null);
  };

  const runSuggestAndPlace = useCallback(async () => {
    if (!layout) return;
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/scene-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout,
          overview: session.analysis?.overview,
        }),
      });
      const data = (await res.json()) as {
        items?: SceneSuggestionItem[];
        error?: string;
        details?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.details || data.error || `Request failed (${res.status})`,
        );
      }
      if (!data.items?.length) {
        throw new Error("No suggestions returned");
      }
      setOnlinePlacements(data.items);
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : String(e));
    } finally {
      setSuggestLoading(false);
    }
  }, [layout, session.analysis?.overview]);

  const toggleSim = () => {
    setSimRunning((prev) => {
      if (prev) {
        // Stopping — keep reports visible.
        return false;
      }
      // Starting — clear previous reports.
      setReports([]);
      return true;
    });
  };

  if (!session.imageDataUrl || !session.analysis) {
    return (
      <div className="frosted-glass rounded-2xl p-8 text-center animate-slide-in-up">
        <h2 className="text-lg font-semibold text-foreground">
          No analysis loaded
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Run an analysis first, then come back to view the procedural scene.
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

  return (
    <div className="space-y-4 animate-slide-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Procedural scene
          </h1>
          <p className="text-xs text-muted-foreground">
            Stylized low-poly approximation. Drag empty space to orbit · scroll
            to zoom · drag fixtures to slide them along the floor · hold Shift
            and drag to rotate.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {layout ? (
            <>
              <button
                type="button"
                onClick={runSuggestAndPlace}
                disabled={suggestLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-60"
              >
                {suggestLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Suggest &amp; place (online GLB)
              </button>
              {onlinePlacements.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOnlinePlacements([])}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/40"
                >
                  <X className="w-4 h-4" />
                  Clear props
                </button>
              ) : null}
            </>
          ) : null}
          {layout ? (
            <>
              <button
                type="button"
                onClick={toggleSim}
                className={
                  simRunning
                    ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/60 bg-destructive/15 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/25"
                    : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                }
              >
                {simRunning ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop simulation
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start simulation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={addPerson}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
                title="Add another agent to the simulation"
              >
                <UserPlus className="w-4 h-4" />
                Add person
                <span className="ml-1 rounded bg-bg-elevated px-1.5 py-0.5 text-[11px] text-fg-muted">
                  {personas.length}
                </span>
              </button>
              <button
                type="button"
                onClick={cycleSpeed}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
                title="Cycle agent walking speed"
              >
                <FastForward className="w-4 h-4" />
                Speed
                <span className="ml-1 rounded bg-bg-elevated px-1.5 py-0.5 text-[11px] text-fg-muted">
                  {speedMultiplier}x
                </span>
              </button>
            </>
          ) : null}
          <Link
            href={`/analyze/${session.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to photo view
          </Link>
        </div>
      </div>

      {layout ? (
        <>
          {suggestError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {suggestError}
            </div>
          ) : null}
          {onlinePlacements.length > 0 ? (
            <ul className="rounded-xl border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
              <li className="mb-1 font-medium text-foreground">
                Suggested props (parallel GLB load)
              </li>
              {onlinePlacements.map((p) => (
                <li key={p.id} className="border-t border-border/60 py-1 first:border-t-0 first:pt-0">
                  <span className="text-foreground">{p.label}</span>
                  {" — "}
                  {p.reason}
                </li>
              ))}
            </ul>
          ) : null}
          <SceneViewer
            layout={layout}
            issues={issues}
            simRunning={simRunning}
            personas={personas}
            speed={BASE_SPEED * speedMultiplier}
            onReport={handleReport}
            onlinePlacements={onlinePlacements}
            extraFixtures={extraFixtures}
            className="h-[70vh] min-h-[480px] w-full"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editLoading) submitEdit();
            }}
            className="frosted-glass flex flex-col gap-2 rounded-2xl px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Edit the scene with words
                </h3>
                <p className="text-xs text-muted-foreground">
                  e.g. &ldquo;put a ramp right in front of the seating
                  platform&rdquo; or &ldquo;add a grab bar next to the
                  toilet&rdquo;.
                  {extraFixtures.length > 0 ? (
                    <>
                      {" "}
                      {extraFixtures.length} added fixture
                      {extraFixtures.length === 1 ? "" : "s"}.
                    </>
                  ) : null}
                </p>
              </div>
              {extraFixtures.length > 0 ? (
                <button
                  type="button"
                  onClick={clearEdits}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              ) : null}
            </div>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe a change to make…"
                disabled={editLoading}
                className="h-10 flex-1 rounded-lg border border-border bg-bg-elevated/70 px-3 text-sm text-foreground placeholder:text-fg-subtle focus:border-border-strong focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={editLoading || !editPrompt.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Apply
              </button>
            </div>
            {editError ? (
              <p className="text-xs text-destructive">{editError}</p>
            ) : null}
          </form>
          <SimulationReports
            reports={reports}
            issues={issues}
            running={simRunning}
          />
        </>
      ) : (
        <div className="frosted-glass rounded-2xl p-10 text-center">
          <Box className="mx-auto h-10 w-10 text-fg-subtle" />
          <h2 className="mt-3 text-base font-semibold text-foreground">
            No room layout was generated
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The model couldn&apos;t infer a confident 3D layout from this photo.
            Try a wider shot that shows the floor and at least two walls.
          </p>
        </div>
      )}
    </div>
  );
}
