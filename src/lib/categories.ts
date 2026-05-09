export type Category =
  | "mobility"
  | "sensory"
  | "wayfinding"
  | "lighting"
  | "signage"
  | "communication";

export const CATEGORIES: Category[] = [
  "mobility",
  "sensory",
  "wayfinding",
  "lighting",
  "signage",
  "communication",
];

export const CATEGORY_LABEL: Record<Category, string> = {
  mobility: "Mobility",
  sensory: "Sensory",
  wayfinding: "Wayfinding",
  lighting: "Lighting",
  signage: "Signage",
  communication: "Communication",
};

export const CATEGORY_DESCRIPTION: Record<Category, string> = {
  mobility:
    "Pathways, ramps, door clearances, seating spacing — anything affecting wheelchair, walker, or stroller users.",
  sensory:
    "Visual contrast, noise, glare, and tactile cues — affecting low vision, deaf/hard of hearing, and sensory-sensitive users.",
  wayfinding: "How easy it is to figure out where to go and what to do.",
  lighting: "Brightness, evenness, and glare in the space.",
  signage: "Placement, contrast, font, height, and clarity of signs.",
  communication:
    "Counter heights, intercoms, and how staff and users exchange information.",
};
