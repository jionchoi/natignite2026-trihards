"use client";

import { Field } from "@/components/forms/Field";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";

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
    </div>
  );
}
