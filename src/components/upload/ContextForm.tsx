"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Field } from "@/components/forms/Field";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_DESCRIPTION,
  type Category,
} from "@/lib/categories";
import { cn } from "@/lib/cn";

export type SpaceType =
  | "cafe"
  | "restaurant"
  | "office"
  | "retail"
  | "venue"
  | "hotel"
  | "public"
  | "other";

export interface ContextValue {
  spaceType: SpaceType;
  notes: string;
  /** Categories the analysis should focus on. Empty or all-selected = review everything. */
  focusCategories: Category[];
  /** Free-text custom issue the user wants the analysis to specifically look for. */
  otherFocus: string;
}

const SPACE_TYPE_LABEL: Record<SpaceType, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  office: "Office",
  retail: "Retail / store",
  venue: "Event venue",
  hotel: "Hotel / hospitality",
  public: "Public space",
  other: "Other",
};

interface ContextFormProps {
  value: ContextValue;
  onChange: (next: ContextValue) => void;
}

export function ContextForm({ value, onChange }: ContextFormProps) {
  const allSelected = value.focusCategories.length === CATEGORIES.length;
  const [showOther, setShowOther] = useState(value.otherFocus.trim().length > 0);
  const otherActive = showOther || value.otherFocus.trim().length > 0;

  const toggleCategory = (category: Category) => {
    const next = value.focusCategories.includes(category)
      ? value.focusCategories.filter((c) => c !== category)
      : [...value.focusCategories, category];
    onChange({ ...value, focusCategories: next });
  };

  const selectAll = () => {
    onChange({ ...value, focusCategories: [...CATEGORIES] });
  };

  const toggleOther = () => {
    if (otherActive) {
      // Collapsing clears whatever was typed.
      setShowOther(false);
      onChange({ ...value, otherFocus: "" });
    } else {
      setShowOther(true);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <Field
        label="Space type"
        htmlFor="space-type"
        description="Helps tailor the analysis."
      >
        <Select
          id="space-type"
          value={value.spaceType}
          onChange={(e) =>
            onChange({ ...value, spaceType: e.target.value as SpaceType })
          }
        >
          {Object.entries(SPACE_TYPE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Notes (optional)"
        htmlFor="notes"
        description="Anything specific you're worried about? Audience, recent changes, etc."
      >
        <Textarea
          id="notes"
          placeholder="e.g. we host monthly events with up to 80 guests."
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Focus areas"
          description="Pick the accessibility categories you want the analysis to prioritize. Leave all selected to review everything."
        >
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              aria-pressed={allSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                allSelected
                  ? "border-brand bg-brand/20 text-brand ring-2 ring-brand/30 shadow-sm"
                  : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {allSelected ? <Check className="h-3.5 w-3.5" /> : null}
              All categories
            </button>
            {CATEGORIES.map((category) => {
              const active = value.focusCategories.includes(category);
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => toggleCategory(category)}
                  aria-pressed={active}
                  title={CATEGORY_DESCRIPTION[category]}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-brand bg-brand/20 text-brand ring-2 ring-brand/30 shadow-sm"
                      : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
                  )}
                >
                  {active ? <Check className="h-3.5 w-3.5" /> : null}
                  {CATEGORY_LABEL[category]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleOther}
              aria-pressed={otherActive}
              title="Describe a specific issue not covered by the categories above."
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                otherActive
                  ? "border-brand bg-brand/20 text-brand ring-2 ring-brand/30 shadow-sm"
                  : "border-border bg-bg-subtle text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {otherActive ? <Check className="h-3.5 w-3.5" /> : null}
              Other
            </button>
          </div>

          {otherActive ? (
            <Textarea
              id="other-focus"
              className="mt-2"
              placeholder="Describe a specific issue you want checked, e.g. 'the temporary ramp by the side door feels too steep'."
              value={value.otherFocus}
              onChange={(e) =>
                onChange({ ...value, otherFocus: e.target.value })
              }
            />
          ) : null}
        </Field>
      </div>
    </div>
  );
}
