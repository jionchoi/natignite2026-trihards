"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FilePreview } from "@/components/upload/FilePreview";
import { ContextForm, type ContextValue } from "@/components/upload/ContextForm";
import { ImportExportButton } from "@/components/io";
import { fileToDataUrl, generateId } from "@/lib/image";
import { useSession } from "@/lib/store";

const initialContext: ContextValue = { spaceType: "cafe", notes: "" };

export default function StartPage() {
  const router = useRouter();
  const startSession = useSession((s) => s.startSession);

  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<ContextValue>(initialContext);
  const [submitting, setSubmitting] = useState(false);

  const onAnalyze = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const loaded = await fileToDataUrl(file);
      const id = generateId();
      startSession({
        id,
        imageDataUrl: loaded.dataUrl,
        width: loaded.width,
        height: loaded.height,
        context,
      });
      router.push(`/analyze/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-border-strong hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ImportExportButton />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-stretch justify-center px-4 py-24 sm:px-6">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle">
            new audit
          </p>
          <h1 className="halftone-title font-serif mt-3 text-4xl leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-6xl">
            upload a space
          </h1>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {file ? (
            <FilePreview file={file} onRemove={() => setFile(null)} />
          ) : (
            <DropZone onFile={setFile} />
          )}

          <div className="frosted-glass rounded-xl p-4 sm:p-5">
            <ContextForm value={context} onChange={setContext} />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {file && !submitting ? (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setContext(initialContext);
                }}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-transparent px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                Reset
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!file || submitting}
              className="start-pill group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium tracking-wide text-background transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.25em] text-fg-subtle">
          jpg · png · webp · up to 10 mb
        </p>
      </div>
    </main>
  );
}
