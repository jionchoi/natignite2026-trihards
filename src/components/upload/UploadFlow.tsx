"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { DropZone } from "./DropZone";
import { FilePreview } from "./FilePreview";
import { ContextForm, type ContextValue } from "./ContextForm";
import { fileToDataUrl, generateId } from "@/lib/image";
import { useSession } from "@/lib/store";

const initialContext: ContextValue = { spaceType: "cafe", notes: "" };

export function UploadFlow() {
  const router = useRouter();
  const startSession = useSession((s) => s.startSession);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<ContextValue>(initialContext);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
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
    <Card>
      <CardBody className="space-y-6">
        {file ? (
          <FilePreview file={file} onRemove={() => setFile(null)} />
        ) : (
          <DropZone onFile={setFile} />
        )}

        <div className="border-t border-border pt-6">
          <ContextForm value={context} onChange={setContext} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              setContext(initialContext);
            }}
            disabled={!file && !context.notes}
          >
            Reset
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!file}
            loading={submitting}
          >
            Analyze space
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
