import type { ComponentType } from "react";

/**
 * Filled white SVG glyphs for decorative background use only (pointer-events: none).
 * Solid shapes — no stroke-only outlines — for high contrast on ambient backgrounds.
 */
export function GlyphPriorityPass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#ffffff"
        d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2l5.5 3.4v6.8L12 18l-5.5-3.4V7.6L12 4.2z"
      />
      <path fill="#ffffff" d="M9 10h6v4H9z" />
    </svg>
  );
}

export function GlyphRamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#ffffff"
        d="M4 18h16v2H4v-2zm2-4l7-8 7 8H6z"
      />
    </svg>
  );
}

export function GlyphDoorWide({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#ffffff" d="M4 4h8v16H4V4zm10 0h6v16h-6V4zm2 2v12h2V6h-2z" />
    </svg>
  );
}

export function GlyphEyeSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <ellipse cx="12" cy="12" rx="10" ry="6.5" fill="#ffffff" />
    </svg>
  );
}

export function GlyphEarSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#ffffff"
        d="M12 4c-3 0-5 2.5-5 6 0 4 2 7 5 9 1 .5 2 .5 3 0 3-2 5-5 5-9 0-3.5-2-6-5-6-1 0-2 .3-3 .8V4.8c1-.5 2-.8 3-.8z"
      />
    </svg>
  );
}

export function GlyphHandSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#ffffff"
        d="M8 10V8c0-1.1.9-2 2-2s2 .9 2 2v6l5-1v-3c0-1.1.9-2 2-2s2 .9 2 2v7c0 3-2.5 5.5-5.5 5.5H11c-2.5 0-4.5-2-5-4.5l-1.5-6c-.3-1.2.6-2.4 1.8-2.7.4-.1.8-.2 1.2-.2.7 0 1.3.3 1.8.7z"
      />
    </svg>
  );
}

export function GlyphCaptionSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="#ffffff" />
      <rect x="6" y="15.5" width="12" height="2.5" rx="0.5" fill="#ffffff" />
      <rect x="6" y="19" width="9" height="2" rx="0.5" fill="#ffffff" />
    </svg>
  );
}

export function GlyphContrastSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#ffffff" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3v14c-3.9 0-7-3.1-7-7s3.1-7 7-7z" />
    </svg>
  );
}

export function GlyphVolumeSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#ffffff" d="M4 10v4h4l5 4V6l-5 4H4zm13.5 2c0-1.8-1-3.5-2.5-4.5v9c1.5-1 2.5-2.7 2.5-4.5z" />
    </svg>
  );
}

export function GlyphPersonSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path fill="#ffffff" d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6v2H6v-2z" />
    </svg>
  );
}

export function GlyphPlusSolid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="10" y="4" width="4" height="16" rx="1" fill="#ffffff" />
      <rect x="4" y="10" width="16" height="4" rx="1" fill="#ffffff" />
    </svg>
  );
}

export type SolidGlyphComponent = ComponentType<{ className?: string }>;

export const SOLID_A11Y_GLYPHS: SolidGlyphComponent[] = [
  GlyphPriorityPass,
  GlyphRamp,
  GlyphDoorWide,
  GlyphEyeSolid,
  GlyphEarSolid,
  GlyphHandSolid,
  GlyphCaptionSolid,
  GlyphContrastSolid,
  GlyphVolumeSolid,
  GlyphPersonSolid,
  GlyphPlusSolid,
];
