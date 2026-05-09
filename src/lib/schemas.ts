import { z } from "zod";

export const SeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const CategorySchema = z.enum([
  "mobility",
  "sensory",
  "wayfinding",
  "lighting",
  "signage",
  "communication",
]);

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
const CATEGORIES = [
  "mobility",
  "sensory",
  "wayfinding",
  "lighting",
  "signage",
  "communication",
] as const;

const lc = (v: unknown) =>
  typeof v === "string" ? v.trim().toLowerCase() : v;

const isCategory = (v: unknown): v is (typeof CATEGORIES)[number] =>
  typeof v === "string" &&
  (CATEGORIES as readonly string[]).includes(v);
const isSeverity = (v: unknown): v is (typeof SEVERITIES)[number] =>
  typeof v === "string" && (SEVERITIES as readonly string[]).includes(v);

const SafeCategorySchema = z.preprocess((v) => {
  const x = lc(v);
  if (isCategory(x)) return x;
  return "wayfinding";
}, CategorySchema);

const SafeSeveritySchema = z.preprocess((v) => {
  const x = lc(v);
  if (isSeverity(x)) return x;
  return "info";
}, SeveritySchema);

const IssueObjectSchema = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    category: z.unknown().optional(),
    severity: z.unknown().optional(),
    description: z.string(),
    recommendation: z.string(),
    standardsRef: z.string().nullish(),
    needsExpert: z.boolean().optional().default(false),
    locationHint: z
      .object({ x: z.number(), y: z.number() })
      .nullish(),
  })
  .passthrough();

export const IssueSchema = IssueObjectSchema.transform((raw, ctx) => {
  const cat = lc(raw.category);
  const sev = lc(raw.severity);

  let category = isCategory(cat) ? cat : null;
  let severity = isSeverity(sev) ? sev : null;

  if (!category && isCategory(sev)) category = sev;
  if (!severity && isSeverity(cat)) severity = cat;

  if (!category) category = "wayfinding";
  if (!severity) severity = "info";

  const id =
    raw.id ??
    `${category}-${severity}-${(raw.title || "issue")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 32)}-${Math.floor(Math.random() * 1e6)}`;

  const rawAny = raw as unknown as { relatedFixtureId?: unknown };
  const relatedFixtureId =
    typeof rawAny.relatedFixtureId === "string" ? rawAny.relatedFixtureId : null;

  return {
    id,
    title: raw.title,
    category,
    severity,
    description: raw.description,
    recommendation: raw.recommendation,
    standardsRef: raw.standardsRef ?? null,
    needsExpert: !!raw.needsExpert,
    locationHint: raw.locationHint ?? null,
    relatedFixtureId,
  };
});

export const SummarySchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
});

export const FixtureTypeSchema = z.enum([
  "door",
  "toilet",
  "sink",
  "grab_bar",
  "signage",
  "seating",
  "counter",
  "obstacle",
  "column",
  "ramp",
  "step",
  "other",
]);

export const WallSchema = z.object({
  start: z.tuple([z.number(), z.number()]),
  end: z.tuple([z.number(), z.number()]),
  height: z.number().positive(),
});

export const FixtureSchema = z.object({
  id: z.string(),
  type: FixtureTypeSchema,
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotationY: z.number().default(0),
  size: z.tuple([
    z.number().positive(),
    z.number().positive(),
    z.number().positive(),
  ]),
  label: z.string().optional(),
});

export const RoomLayoutSchema = z.object({
  floor: z.object({
    polygon: z.array(z.tuple([z.number(), z.number()])).min(3),
  }),
  walls: z.array(WallSchema),
  fixtures: z.array(FixtureSchema).default([]),
});

export const AnalysisSchema = z
  .object({
    overview: z.string(),
    summary: SummarySchema.optional(),
    issues: z.array(IssueSchema),
    roomLayout: RoomLayoutSchema.nullish(),
  })
  .transform((raw) => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    for (const issue of raw.issues) counts[issue.severity] += 1;
    return {
      overview: raw.overview,
      summary: raw.summary ?? counts,
      issues: raw.issues,
      roomLayout: raw.roomLayout ?? null,
    };
  });

export type Issue = z.infer<typeof IssueSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type RoomLayout = z.infer<typeof RoomLayoutSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type FixtureType = z.infer<typeof FixtureTypeSchema>;
export type Wall = z.infer<typeof WallSchema>;
