import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "cyan"
  | "success"
  | "warning"
  | "danger";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-elevated text-muted",
  primary: "border-primary/20 bg-primary/10 text-primary",
  cyan: "border-cyan/20 bg-cyan-subtle text-cyan",
  success: "border-success/20 bg-success-bg text-success",
  warning: "border-warning/20 bg-warning-bg text-warning",
  danger: "border-danger/20 bg-danger-bg text-danger",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-technical inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
