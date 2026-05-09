"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Sparkles, Loader2, DoorOpen, Bath, ParkingCircle, Store } from "lucide-react";
import { ParticleBackground } from "@frontend/components/particle-background";
import { DropZone } from "@/components/upload/DropZone";
import { FilePreview } from "@/components/upload/FilePreview";
import { ContextForm, type ContextValue } from "@/components/upload/ContextForm";
import { fileToDataUrl, generateId } from "@/lib/image";
import { useSession } from "@/lib/store";

const FloatingRoom = dynamic(
  () => import("@frontend/components/floating-room").then((m) => m.FloatingRoom),
  {
    ssr: false,
    loading: () => <div className="w-full h-48 sm:h-64 md:h-72" aria-hidden />,
  },
);

const initialContext: ContextValue = { spaceType: "cafe", notes: "" };

export default function HomePage() {
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
    <>
      <main className="relative min-h-screen overflow-hidden">
        <ParticleBackground />

        <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-12 md:py-16">
          <header className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 teal-glow">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
                Accessify
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto px-2 text-balance">
              Upload a photo of a space and get an interactive 3D view plus
              AI-powered accessibility feedback. Identify barriers before your
              customers do.
            </p>
          </header>

          {!file && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl mb-6 sm:mb-8">
              {[
                { icon: DoorOpen, label: "Entrances" },
                { icon: Bath, label: "Restrooms" },
                { icon: ParkingCircle, label: "Parking" },
                { icon: Store, label: "Retail Space" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="frosted-glass rounded-lg p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 text-center"
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!file && (
            <div className="w-full max-w-2xl animate-fade-in mb-6 sm:mb-8">
              <FloatingRoom />
            </div>
          )}

          <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
            {file ? (
              <FilePreview file={file} onRemove={() => setFile(null)} />
            ) : (
              <DropZone onFile={setFile} />
            )}

            <div className="frosted-glass rounded-xl p-4 sm:p-6">
              <ContextForm value={context} onChange={setContext} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={!file || submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto teal-glow"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze Accessibility</span>
                  </>
                )}
              </button>

              {file && !submitting ? (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setContext(initialContext);
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 px-6 text-base font-medium text-foreground transition-colors hover:border-border-strong hover:bg-secondary/60 w-full sm:w-auto"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <footer className="mt-12 sm:mt-16 text-center px-4">
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Powered by computer vision AI. Results are advisory and should be
              verified by a certified accessibility consultant.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
