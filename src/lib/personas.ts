import { type Category } from "@/lib/categories";

export type Persona = "ambulatory" | "wheelchair" | "blind";

export const ALL_PERSONAS: Persona[] = ["ambulatory", "wheelchair", "blind"];

export const PERSONA_LABEL: Record<Persona, string> = {
  ambulatory: "Ambulatory user",
  wheelchair: "Wheelchair user",
  blind: "Blind / cane user",
};

export const PERSONA_SHORT: Record<Persona, string> = {
  ambulatory: "Ambulatory",
  wheelchair: "Wheelchair",
  blind: "Blind",
};

// Body / accent color for the agent mesh and the report chip.
export const PERSONA_COLOR: Record<Persona, string> = {
  ambulatory: "#5aa9e6",
  wheelchair: "#2bbfa8",
  blind: "#a76aff",
};

// Which issue categories does this persona "trip over" while walking around?
// An agent only reports an issue whose category is in this list.
export const PERSONA_CATEGORIES: Record<Persona, Category[]> = {
  ambulatory: ["mobility"],
  wheelchair: ["mobility", "signage"],
  blind: ["signage", "wayfinding", "sensory", "lighting", "communication"],
};
