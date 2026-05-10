"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Accessibility,
  DoorOpen,
  Bath,
  ParkingCircle,
  Store,
  Eye,
  Ruler,
  Sparkles,
} from "lucide-react";

const DottedHouseBackground = dynamic(
  () =>
    import("@/components/landing/DottedHouseBackground").then(
      (m) => m.DottedHouseBackground,
    ),
  { ssr: false, loading: () => null },
);

const ICON_ROW = [
  { Icon: Accessibility, key: "a11y" },
  { Icon: DoorOpen, key: "doors" },
  { Icon: Bath, key: "bath" },
  { Icon: Sparkles, key: "ai" },
  { Icon: ParkingCircle, key: "parking" },
  { Icon: Store, key: "store" },
  { Icon: Eye, key: "vision" },
  { Icon: Ruler, key: "ruler" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <DottedHouseBackground />
      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="mb-8 flex items-center justify-center gap-5 sm:gap-7 opacity-70">
          {ICON_ROW.map(({ Icon, key }) => (
            <Icon
              key={key}
              className="h-4 w-4 text-foreground/80 sm:h-5 sm:w-5"
              aria-hidden
            />
          ))}
        </div>

        <h1 className="halftone-title font-serif text-[3.5rem] leading-[0.95] tracking-[-0.04em] sm:text-[5rem] md:text-[7rem] lg:text-[8rem]">
          accessify
        </h1>

        <p className="mt-5 max-w-md text-balance text-sm text-muted-foreground sm:mt-6 sm:max-w-lg sm:text-base md:text-lg">
          ai-powered accessibility audits for any space —
          <br className="hidden sm:block" />
          see the barriers before your customers do.
        </p>

        <div className="mt-10 sm:mt-14">
          <Link
            href="/start"
            className="start-pill group inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-medium tracking-wide text-background transition-all hover:bg-white sm:text-base"
          >
            <span>Start</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="mt-12 text-[11px] uppercase tracking-[0.25em] text-fg-subtle sm:text-xs">
          built with computer vision · gemini · webgl
        </p>
      </section>
    </main>
  );
}
