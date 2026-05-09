"use client";

import { Button } from "@/components/ui/Button";
import { type Analysis } from "@/lib/schemas";
import { CATEGORY_LABEL } from "@/lib/categories";
import { SEVERITY_LABEL, SEVERITY_RANK } from "@/lib/severity";

interface DownloadReportButtonProps {
  analysis: Analysis;
  spaceType: string;
  notes?: string;
}

function buildMarkdown({
  analysis,
  spaceType,
  notes,
}: DownloadReportButtonProps): string {
  const lines: string[] = [];
  lines.push(`# Accessibility Report`);
  lines.push("");
  lines.push(`**Space type:** ${spaceType}`);
  if (notes) lines.push(`**Notes:** ${notes}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`## Overview`);
  lines.push("");
  lines.push(analysis.overview);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`| Severity | Count |`);
  lines.push(`| -------- | ----- |`);
  lines.push(`| Critical | ${analysis.summary.critical} |`);
  lines.push(`| High     | ${analysis.summary.high} |`);
  lines.push(`| Medium   | ${analysis.summary.medium} |`);
  lines.push(`| Low      | ${analysis.summary.low} |`);
  lines.push(`| Info     | ${analysis.summary.info} |`);
  lines.push("");
  lines.push(`## Issues`);
  lines.push("");
  const sorted = [...analysis.issues].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  sorted.forEach((issue, idx) => {
    lines.push(
      `### ${idx + 1}. ${issue.title} — ${SEVERITY_LABEL[issue.severity]} · ${CATEGORY_LABEL[issue.category]}`,
    );
    lines.push("");
    lines.push(`**Observation:** ${issue.description}`);
    lines.push("");
    lines.push(`**Recommendation:** ${issue.recommendation}`);
    if (issue.standardsRef) {
      lines.push("");
      lines.push(`**Reference:** ${issue.standardsRef}`);
    }
    if (issue.needsExpert) {
      lines.push("");
      lines.push(
        `> Specialist review recommended — measurements or standards compliance can't be confirmed from a photo alone.`,
      );
    }
    lines.push("");
  });
  return lines.join("\n");
}

export function DownloadReportButton(props: DownloadReportButtonProps) {
  const onClick = () => {
    const md = buildMarkdown(props);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download report
    </Button>
  );
}
