"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ViewerControlsProps {
  wireframe: boolean;
  onWireframeToggle: () => void;
  displacement: number;
  onDisplacementChange: (value: number) => void;
  onReset: () => void;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
  className?: string;
}

export function ViewerControls({
  wireframe,
  onWireframeToggle,
  displacement,
  onDisplacementChange,
  onReset,
  autoRotate,
  onAutoRotateToggle,
  className,
}: ViewerControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 backdrop-blur",
        className,
      )}
    >
      <Button variant="ghost" size="sm" onClick={onReset}>
        Reset view
      </Button>
      <div className="h-4 w-px bg-border" />
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Depth</span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.05}
          value={displacement}
          onChange={(e) => onDisplacementChange(parseFloat(e.target.value))}
          className="accent-brand"
          aria-label="Depth strength"
        />
        <span className="w-8 tabular-nums text-fg">
          {displacement.toFixed(2)}
        </span>
      </label>
      <div className="h-4 w-px bg-border" />
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={onAutoRotateToggle}
          className="accent-brand"
        />
        Auto-rotate
      </label>
      <div className="h-4 w-px bg-border" />
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={wireframe}
          onChange={onWireframeToggle}
          className="accent-brand"
        />
        Wireframe
      </label>
    </div>
  );
}
