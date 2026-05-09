"use client";

import { type Issue } from "@/lib/schemas";
import { SEVERITY_RANK } from "@/lib/severity";
import { IssueCard } from "./IssueCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface IssueListProps {
  issues: Issue[];
  onHoverChange?: (id: string | null) => void;
}

export function IssueList({ issues, onHoverChange }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <EmptyState
        title="No issues match these filters"
        description="Try clearing filters to see the full report."
      />
    );
  }

  const sorted = [...issues].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((issue, idx) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          index={idx}
          onHoverChange={onHoverChange}
        />
      ))}
    </div>
  );
}
