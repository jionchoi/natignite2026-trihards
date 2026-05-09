"use client";

import { useEffect, useState } from "react";
import { X, FileImage } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative w-full frosted-glass rounded-xl p-4 sm:p-6">
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          aria-label="Remove uploaded photo"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
        </button>
      ) : null}
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-secondary/40">
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={file.name}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : null}
      </div>
      <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
        <FileImage className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <span className="text-xs sm:text-sm text-foreground truncate">
          {file.name}
        </span>
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
}
