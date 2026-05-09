"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type Issue } from "@/lib/schemas";
import { SEVERITY_LABEL, SEVERITY_RANK } from "@/lib/severity";
import { CATEGORY_LABEL } from "@/lib/categories";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pin } from "./Pin";

interface PinnedReportProps {
  imageUrl: string;
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface ImgRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function PinnedReport({
  imageUrl,
  issues,
  selectedId,
  onSelect,
}: PinnedReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgRect, setImgRect] = useState<ImgRect | null>(null);

  const pinnedIssues = useMemo(
    () => issues.filter((i) => i.locationHint),
    [issues],
  );

  const sortedBySeverity = useMemo(
    () =>
      [...pinnedIssues].sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
      ),
    [pinnedIssues],
  );

  // If filtering removes the selected issue, fall back to the most severe pin.
  useEffect(() => {
    if (selectedId && !pinnedIssues.find((i) => i.id === selectedId)) {
      onSelect(sortedBySeverity[0]?.id ?? null);
    }
  }, [pinnedIssues, selectedId, sortedBySeverity, onSelect]);

  const selectedIssue = useMemo(
    () => pinnedIssues.find((i) => i.id === selectedId) ?? null,
    [pinnedIssues, selectedId],
  );

  // Track the rendered <img> rect so pins land exactly over the image even
  // when object-contain letterboxes within the container.
  const updateRect = () => {
    const img = imgRef.current;
    const cont = containerRef.current;
    if (!img || !cont || !img.naturalWidth) return;
    const iRect = img.getBoundingClientRect();
    const cRect = cont.getBoundingClientRect();
    setImgRect({
      left: iRect.left - cRect.left,
      top: iRect.top - cRect.top,
      width: iRect.width,
      height: iRect.height,
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(updateRect);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pinnedIssues.length === 0) {
    return (
      <EmptyState
        title="No located issues"
        description="None of the identified issues had a location hint to plot on the photo."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-black ring-1 ring-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Analyzed space"
          onLoad={updateRect}
          className="max-h-full max-w-full object-contain"
        />
        {imgRect ? (
          <div
            className="pointer-events-none absolute"
            style={{
              left: imgRect.left,
              top: imgRect.top,
              width: imgRect.width,
              height: imgRect.height,
            }}
          >
            {pinnedIssues.map((issue) => (
              <Pin
                key={issue.id}
                issue={issue}
                selected={issue.id === selectedId}
                onClick={() => onSelect(issue.id)}
              />
            ))}
            {selectedIssue && selectedIssue.locationHint ? (
              <div
                className="pointer-events-none absolute z-10 max-w-[55%]"
                style={{
                  left: `${selectedIssue.locationHint.x * 100}%`,
                  top: `${selectedIssue.locationHint.y * 100}%`,
                  transform:
                    selectedIssue.locationHint.x < 0.5
                      ? "translate(14px, -50%)"
                      : "translate(calc(-100% - 14px), -50%)",
                }}
              >
                <div className="rounded-md border border-border bg-bg-elevated/95 px-2 py-1 text-[11px] font-medium text-fg shadow-lg backdrop-blur">
                  <span className="text-fg-subtle">
                    #{pinnedIssues.findIndex((i) => i.id === selectedIssue.id) + 1}
                    {" · "}
                  </span>
                  {selectedIssue.title}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedIssue ? (
        <div className="scrollbar-thin max-h-[45%] shrink-0 overflow-y-auto rounded-xl border border-border bg-bg-elevated p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-fg">
              {selectedIssue.title}
            </h3>
            <Badge severity={selectedIssue.severity}>
              {SEVERITY_LABEL[selectedIssue.severity]}
            </Badge>
            <span className="text-xs text-fg-subtle">
              {CATEGORY_LABEL[selectedIssue.category]}
            </span>
          </div>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Observation
              </dt>
              <dd className="mt-1 text-fg-muted">
                {selectedIssue.description}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Recommendation
              </dt>
              <dd className="mt-1 text-fg">{selectedIssue.recommendation}</dd>
            </div>
            {selectedIssue.standardsRef ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  Reference
                </dt>
                <dd className="mt-1 font-mono text-xs text-fg-muted">
                  {selectedIssue.standardsRef}
                </dd>
              </div>
            ) : null}
            {selectedIssue.needsExpert ? (
              <p className="rounded-md border border-severity-info/30 bg-severity-info/10 px-3 py-2 text-xs text-severity-info">
                Specialist review recommended — measurements or standards
                compliance can&apos;t be confirmed from a photo alone.
              </p>
            ) : null}
          </dl>
        </div>
      ) : (
        <p className="shrink-0 text-center text-xs text-fg-subtle">
          Click a pin to inspect the issue.
        </p>
      )}
    </div>
  );
}
