"use client";

import { useMemo, useState } from "react";
import { type Analysis } from "@/lib/schemas";
import { type Category } from "@/lib/categories";
import { ReportSummary } from "./ReportSummary";
import { CategoryFilter } from "./CategoryFilter";
import { PinnedReport } from "./PinnedReport";
import { DownloadReportButton } from "./DownloadReportButton";

interface AccessibilityReportProps {
  imageUrl: string;
  analysis: Analysis;
  spaceType: string;
  notes?: string;
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
}

export function AccessibilityReport({
  imageUrl,
  analysis,
  spaceType,
  notes,
  selectedIssueId,
  onSelectIssue,
}: AccessibilityReportProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(),
  );

  const availableCategories = useMemo(
    () => new Set(analysis.issues.map((i) => i.category)),
    [analysis.issues],
  );

  const filteredIssues = useMemo(() => {
    if (selectedCategories.size === 0) return analysis.issues;
    return analysis.issues.filter((i) => selectedCategories.has(i.category));
  }, [analysis.issues, selectedCategories]);

  const toggleCategory = (c: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-fg-subtle">
            audit findings
          </span>
          <h2 className="halftone-title-sm font-serif text-xl leading-none tracking-tight">
            accessibility report
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            pins mark each issue. click to inspect.
          </p>
        </div>
        <DownloadReportButton
          analysis={analysis}
          spaceType={spaceType}
          notes={notes}
        />
      </div>

      <div className="space-y-4 border-b border-border px-5 py-4">
        <ReportSummary
          overview={analysis.overview}
          summary={analysis.summary}
        />
      </div>

      <div className="border-b border-border px-5 py-3">
        <CategoryFilter
          selected={selectedCategories}
          available={availableCategories}
          onToggle={toggleCategory}
          onClear={() => setSelectedCategories(new Set())}
        />
      </div>

      <div className="flex-1 overflow-hidden p-3">
        <PinnedReport
          imageUrl={imageUrl}
          issues={filteredIssues}
          selectedId={selectedIssueId}
          onSelect={onSelectIssue}
        />
      </div>
    </div>
  );
}
