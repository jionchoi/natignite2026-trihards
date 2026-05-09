/**
 * Gemini sometimes returns almost-JSON: markdown fences, trailing commas,
 * smart quotes, prose before/after the object, etc.
 */

const stripTrailingCommas = (s: string) => s.replace(/,\s*([}\]])/g, "$1");

/** Normalize characters models often emit outside strict JSON. */
function normalizeModelText(s: string): string {
  let t = s.replace(/^\uFEFF/, "").trim();
  // Smart / full-width quotes and punctuation
  t = t
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\uFF1A/g, ":") // full-width colon
    .replace(/\uFF0C/g, ","); // full-width comma
  // JS literals JSON rejects
  t = t.replace(/\bNaN\b/g, "null").replace(/\bInfinity\b/g, "null");
  t = t.replace(/\bundefined\b/g, "null");
  return t;
}

function stripOuterMarkdownFence(text: string): string {
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(
    (m) => m[1].trim(),
  );
  if (blocks.length === 0) return text.trim();
  // Prefer the longest fenced block (usually the full payload)
  return blocks.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Balanced `{…}` from `start`, honoring `"` strings and `\\` escapes. */
function extractBalancedObject(source: string, start: number): string | null {
  if (source[start] !== "{") return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];

    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return null;
}

/** Balanced `[…]` from `start`, same string rules. */
function extractBalancedArray(source: string, start: number): string | null {
  if (source[start] !== "[") return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];

    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return null;
}

function tryParseJson(s: string): unknown {
  return JSON.parse(s);
}

/** Repeatedly strip trailing commas until stable. */
function withTrailingCommasFixed(s: string): string {
  let prev = s;
  for (let i = 0; i < 12; i++) {
    const next = stripTrailingCommas(prev);
    if (next === prev) return next;
    prev = next;
  }
  return prev;
}

function parseCandidates(raw: string): string[] {
  const out: string[] = [];
  const trimmed = raw.trim();
  if (!trimmed) return out;

  let text = normalizeModelText(trimmed);
  out.push(text);

  if (text.includes("```")) {
    const inner = normalizeModelText(stripOuterMarkdownFence(text));
    out.push(inner);
    text = inner;
  }

  // Every `{…}` blob starting at each `{`
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    const blob = extractBalancedObject(text, i);
    if (blob) {
      out.push(blob);
      out.push(withTrailingCommasFixed(blob));
    }
  }

  // Root array payloads
  const arrIdx = text.indexOf("[");
  if (arrIdx !== -1) {
    const arr = extractBalancedArray(text, arrIdx);
    if (arr) {
      out.push(arr);
      out.push(withTrailingCommasFixed(arr));
    }
  }

  return [...new Set(out)];
}

export function parseGeminiJson(rawText: string): unknown {
  if (!rawText || !String(rawText).trim()) {
    throw new SyntaxError("Model returned empty output");
  }

  const candidates = parseCandidates(rawText);
  const errors: string[] = [];

  for (const cand of candidates) {
    try {
      return tryParseJson(cand);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    try {
      return tryParseJson(withTrailingCommasFixed(cand));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  const preview = rawText.slice(0, 280).replace(/\s+/g, " ");
  throw new SyntaxError(
    `Could not parse model output as JSON. Preview: ${preview}${rawText.length > 280 ? "…" : ""} (${errors[0] ?? "unknown parse error"})`,
  );
}
