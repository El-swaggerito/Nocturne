import type { ReactNode } from "react";

export function SettingsRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <span className="text-[10px] text-muted">{label}</span>

      <div className="font-technical max-w-[65%] break-words text-right text-[9px]">
        {value}
      </div>
    </div>
  );
}
