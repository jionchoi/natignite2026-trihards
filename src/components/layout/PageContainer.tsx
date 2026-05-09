import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "full";
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-none",
};

export function PageContainer({
  className,
  size = "lg",
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-6", sizeMap[size], className)}
      {...props}
    />
  );
}
