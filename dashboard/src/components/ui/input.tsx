import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-control border border-border bg-background px-3 text-xs text-foreground outline-none transition-colors",
        "placeholder:text-faint",
        "focus:border-primary focus:ring-1 focus:ring-primary",
        "disabled:cursor-not-allowed disabled:text-faint",
        className,
      )}
      {...props}
    />
  );
}
