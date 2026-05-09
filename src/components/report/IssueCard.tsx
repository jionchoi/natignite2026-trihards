"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { type Issue } from "@/lib/schemas";
import { CATEGORY_LABEL } from "@/lib/categories";
import { SEVERITY_LABEL } from "@/lib/severity";
import { cn } from "@/lib/cn";

interface IssueCardProps {
  issue: Issue;
  index: number;
  onHoverChange?: (id: string | null) => void;
}

export function IssueCard({ issue, index, onHoverChange }: IssueCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-bg-elevated transition-colors",
        "hover:border-border-strong",
      )}
      onMouseEnter={() => onHoverChange?.(issue.id)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg-subtle text-xs font-medium tabular-nums text-fg-muted">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-fg">{issue.title}</h3>
            <Badge severity={issue.severity}>
              {SEVERITY_LABEL[issue.severity]}
            </Badge>
            <span className="text-xs text-fg-subtle">
              {CATEGORY_LABEL[issue.category]}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
            {issue.description}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-fg-subtle transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-border px-4 py-3">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Observation
              </dt>
              <dd className="mt-1 text-fg-muted">{issue.description}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Recommendation
              </dt>
              <dd className="mt-1 text-fg">{issue.recommendation}</dd>
            </div>
            {issue.standardsRef ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                  Reference
                </dt>
                <dd className="mt-1 font-mono text-xs text-fg-muted">
                  {issue.standardsRef}
                </dd>
              </div>
            ) : null}
            {issue.needsExpert ? (
              <p className="rounded-md border border-severity-info/30 bg-severity-info/10 px-3 py-2 text-xs text-severity-info">
                Specialist review recommended — measurements or standards
                compliance can&apos;t be confirmed from a photo alone.
              </p>
            ) : null}
          </dl>
        </div>
      ) : null}
    </article>
  );
}
