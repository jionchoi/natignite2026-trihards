import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function Section({
  className,
  title,
  description,
  action,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-8", className)} {...props}>
      {(title || description || action) && (
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-fg">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-fg-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
