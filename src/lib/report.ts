import { CATEGORY_LABEL } from "@/lib/categories";
import { SEVERITY_LABEL, SEVERITY_RANK } from "@/lib/severity";
import { type Analysis } from "@/lib/schemas";

export interface MarkdownReportInput {
  analysis: Analysis;
  spaceType: string;
  notes?: string;
}

export function generateMarkdownReport({
  analysis,
  spaceType,
  notes,
}: MarkdownReportInput): string {
  const lines: string[] = [];
  lines.push("# Accessibility Report");
  lines.push("");
  lines.push(`**Space type:** ${spaceType}`);
  if (notes) lines.push(`**Notes:** ${notes}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Overview");
  lines.push("");
  lines.push(analysis.overview);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("| -------- | ----- |");
  lines.push(`| Critical | ${analysis.summary.critical} |`);
  lines.push(`| High     | ${analysis.summary.high} |`);
  lines.push(`| Medium   | ${analysis.summary.medium} |`);
  lines.push(`| Low      | ${analysis.summary.low} |`);
  lines.push(`| Info     | ${analysis.summary.info} |`);
  lines.push("");
  lines.push("## Issues");
  lines.push("");

  const sorted = [...analysis.issues].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );

  sorted.forEach((issue, idx) => {
    lines.push(
      `### ${idx + 1}. ${issue.title} - ${SEVERITY_LABEL[issue.severity]} / ${CATEGORY_LABEL[issue.category]}`,
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
        "> Specialist review recommended - measurements or standards compliance cannot be confirmed from a photo alone.",
      );
    }
    lines.push("");
  });

  return lines.join("\n");
}
