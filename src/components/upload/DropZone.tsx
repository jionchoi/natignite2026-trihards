"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, Camera } from "lucide-react";
import { cn } from "@/lib/cn";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

interface DropZoneProps {
  onFile: (file: File) => void;
  className?: string;
}

export function DropZone({ onFile, className }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) {
      return "Image must be JPG, PNG, or WebP.";
    }
    if (file.size > MAX_BYTES) {
      return "Image must be 10 MB or smaller.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile, validate],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative frosted-glass flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-4 sm:px-5 sm:py-5 text-left transition-all",
          "hover:bg-white/[0.04] hover:border-primary/30 active:scale-[0.99]",
          isDragging && "border-primary bg-primary/10",
        )}
      >
        <div className="p-2 rounded-lg bg-primary/10">
          <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-foreground font-medium">
            Drop a photo, or browse
          </p>
          <p className="text-xs text-muted-foreground">
            Entrance, restroom, parking, or retail area · JPG, PNG, WebP up to 10 MB
          </p>
        </div>

        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
