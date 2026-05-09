import { cn } from "@/lib/cn";

export type StageId = "upload" | "depth" | "analyze" | "done";

interface Stage {
  id: StageId;
  label: string;
  description: string;
}

const STAGES: Stage[] = [
  { id: "upload", label: "Upload", description: "Photo received" },
  { id: "depth", label: "Reconstruct", description: "Building 3D view" },
  { id: "analyze", label: "Analyze", description: "Reviewing accessibility" },
  { id: "done", label: "Ready", description: "Results below" },
];

interface UploadStepperProps {
  current: StageId;
  className?: string;
}

const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);

export function UploadStepper({ current, className }: UploadStepperProps) {
  const currentIdx = stageIndex(current);

  return (
    <ol
      className={cn(
        "flex items-center gap-2 overflow-x-auto",
        className,
      )}
    >
      {STAGES.map((stage, idx) => {
        const status =
          idx < currentIdx ? "complete" : idx === currentIdx ? "active" : "pending";
        return (
          <li
            key={stage.id}
            className="flex flex-1 items-center gap-3"
            aria-current={status === "active" ? "step" : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors",
                  status === "complete" &&
                    "border-primary bg-primary text-primary-foreground",
                  status === "active" &&
                    "border-primary bg-primary/15 text-primary",
                  status === "pending" &&
                    "border-border bg-secondary/40 text-muted-foreground",
                )}
              >
                {status === "complete" ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    status === "pending" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </div>
            {idx < STAGES.length - 1 ? (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  idx < currentIdx ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
