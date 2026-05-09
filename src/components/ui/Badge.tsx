import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { type Severity } from "@/lib/severity";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity?: Severity;
  variant?: "solid" | "soft" | "outline";
}

const styles: Record<Severity, Record<"solid" | "soft" | "outline", string>> = {
  critical: {
    solid: "bg-severity-critical text-white",
    soft: "bg-severity-critical/15 text-severity-critical border border-severity-critical/30",
    outline: "border border-severity-critical/50 text-severity-critical",
  },
  high: {
    solid: "bg-severity-high text-white",
    soft: "bg-severity-high/15 text-severity-high border border-severity-high/30",
    outline: "border border-severity-high/50 text-severity-high",
  },
  medium: {
    solid: "bg-severity-medium text-bg",
    soft: "bg-severity-medium/15 text-severity-medium border border-severity-medium/30",
    outline: "border border-severity-medium/50 text-severity-medium",
  },
  low: {
    solid: "bg-severity-low text-bg",
    soft: "bg-severity-low/15 text-severity-low border border-severity-low/30",
    outline: "border border-severity-low/50 text-severity-low",
  },
  info: {
    solid: "bg-severity-info text-white",
    soft: "bg-severity-info/15 text-severity-info border border-severity-info/30",
    outline: "border border-severity-info/50 text-severity-info",
  },
};

export function Badge({
  className,
  severity = "info",
  variant = "soft",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles[severity][variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
