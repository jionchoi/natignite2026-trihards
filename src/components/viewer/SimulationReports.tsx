"use client";

import { type Issue } from "@/lib/schemas";
import {
  type Persona,
  PERSONA_COLOR,
  PERSONA_LABEL,
} from "@/lib/personas";
import { CATEGORY_LABEL } from "@/lib/categories";
import { SEVERITY_LABEL } from "@/lib/severity";
import { Badge } from "@/components/ui/Badge";

export interface ReportLogEntry {
  issueId: string;
  persona: Persona;
  count: number;
  firstTs: number;
  lastTs: number;
}

interface SimulationReportsProps {
  reports: ReportLogEntry[];
  issues: Issue[];
  running: boolean;
}

export function SimulationReports({
  reports,
  issues,
  running,
}: SimulationReportsProps) {
  const issuesById = new Map(issues.map((i) => [i.id, i]));

  if (!running && reports.length === 0) {
    return (
      <div className="frosted-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Press <span className="font-medium text-foreground">Start simulation</span>{" "}
        to send people through the space. They&apos;ll report issues they hit.
      </div>
    );
  }

  if (running && reports.length === 0) {
    return (
      <div className="frosted-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Simulation running — waiting for the first encounter…
      </div>
    );
  }

  return (
    <div className="frosted-glass rounded-2xl overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Live encounters
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Each entry is a person bumping into an accessibility barrier.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {reports.map((r) => {
          const issue = issuesById.get(r.issueId);
          if (!issue) return null;
          const accent = PERSONA_COLOR[r.persona];
          return (
            <li key={`${r.issueId}-${r.persona}`} className="px-5 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: accent }}
                />
                <span className="text-xs font-medium text-foreground">
                  {PERSONA_LABEL[r.persona]}
                </span>
                <span className="text-xs text-fg-subtle">
                  hit {CATEGORY_LABEL[issue.category].toLowerCase()} issue
                </span>
                {r.count > 1 ? (
                  <span
                    className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground"
                    title={`Encountered ${r.count} times`}
                  >
                    ×{r.count}
                  </span>
                ) : null}
                <Badge severity={issue.severity} className="ml-auto">
                  {SEVERITY_LABEL[issue.severity]}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {issue.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {issue.recommendation}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
