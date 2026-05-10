import Link from "next/link";
import { PageContainer } from "./PageContainer";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur">
      <PageContainer
        size="full"
        className="flex h-14 items-center justify-between"
      >
        <Link
          href="/"
          className="group flex items-baseline gap-2.5"
          aria-label="accessify home"
        >
          <span className="halftone-title-sm font-serif text-lg leading-none tracking-tight">
            accessify
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle sm:inline-block">
            / space analyzer
          </span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-subtle">
          <Link
            href="/start"
            className="transition-colors hover:text-foreground"
          >
            upload
          </Link>
          <a
            href="https://www.accessiblebydesign.ca/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            about
          </a>
        </nav>
      </PageContainer>
    </header>
  );
}
