import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-elevated disabled:text-faint",
  secondary:
    "border border-border bg-elevated text-foreground hover:border-primary/50 hover:bg-surface-hover disabled:text-faint",
  danger:
    "bg-danger text-white hover:bg-danger-hover disabled:bg-elevated disabled:text-faint",
  ghost:
    "bg-transparent text-muted hover:bg-elevated hover:text-foreground disabled:text-faint",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-control px-3.5 py-2 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
