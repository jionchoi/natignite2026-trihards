"use client";

import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { cn } from "@/lib/cn";

interface CategoryFilterProps {
  selected: Set<Category>;
  available: Set<Category>;
  onToggle: (category: Category) => void;
  onClear: () => void;
}

export function CategoryFilter({
  selected,
  available,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          selected.size === 0
            ? "border-brand bg-brand/15 text-brand"
            : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
        )}
      >
        All
      </button>
      {CATEGORIES.filter((c) => available.has(c)).map((c) => {
        const active = selected.has(c);
        return (
          <button
            type="button"
            key={c}
            onClick={() => onToggle(c)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-brand bg-brand/15 text-brand"
                : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}
