import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageContainer } from "./PageContainer";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur">
      <PageContainer
        size="full"
        className="flex h-14 items-center justify-between"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-serif text-base text-foreground">
            Accessify
          </span>
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            Space Analyzer
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            Upload
          </Link>
          <a
            href="https://www.accessiblebydesign.ca/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            About
          </a>
        </nav>
      </PageContainer>
    </header>
  );
}
