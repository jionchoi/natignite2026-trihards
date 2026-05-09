"use client";

import { type Issue } from "@/lib/schemas";
import { type Severity } from "@/lib/severity";
import { cn } from "@/lib/cn";

interface PinProps {
  issue: Issue;
  selected: boolean;
  onClick: () => void;
}

const SEVERITY_BG: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  info: "bg-severity-info",
};

const SEVERITY_RING: Record<Severity, string> = {
  critical: "ring-severity-critical/40",
  high: "ring-severity-high/40",
  medium: "ring-severity-medium/40",
  low: "ring-severity-low/40",
  info: "ring-severity-info/40",
};

export function Pin({ issue, selected, onClick }: PinProps) {
  const loc = issue.locationHint;
  if (!loc) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={issue.title}
      title={issue.title}
      className={cn(
        "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2",
        "rounded-full border-2 border-white shadow-lg transition-all",
        SEVERITY_BG[issue.severity],
        selected
          ? cn("h-5 w-5 ring-4", SEVERITY_RING[issue.severity])
          : "h-3.5 w-3.5 hover:h-4 hover:w-4",
      )}
      style={{ left: `${loc.x * 100}%`, top: `${loc.y * 100}%` }}
    />
  );
}
