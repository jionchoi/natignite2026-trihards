import { type Summary } from "@/lib/schemas";
import { SEVERITY_LABEL, SEVERITY_ORDER, type Severity } from "@/lib/severity";
import { cn } from "@/lib/cn";

const dotColor: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  info: "bg-severity-info",
};

interface ReportSummaryProps {
  overview: string;
  summary: Summary;
}

export function ReportSummary({ overview, summary }: ReportSummaryProps) {
  const total =
    summary.critical + summary.high + summary.medium + summary.low + summary.info;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-fg-muted">{overview}</p>
      <div className="grid grid-cols-5 gap-2">
        {SEVERITY_ORDER.map((sev) => (
          <div
            key={sev}
            className="rounded-lg border border-border bg-bg-subtle/40 px-2 py-2 text-center"
          >
            <div className="flex items-center justify-center gap-1.5">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  dotColor[sev],
                )}
              />
              <span className="text-xs font-medium text-fg-muted">
                {SEVERITY_LABEL[sev]}
              </span>
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums text-fg">
              {summary[sev]}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-fg-subtle">
        {total} {total === 1 ? "issue" : "issues"} identified.
      </p>
    </div>
  );
}
