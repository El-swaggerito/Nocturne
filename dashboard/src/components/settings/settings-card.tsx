import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type SettingsCardProps = {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  status?: ReactNode;
  children: ReactNode;
};

export function SettingsCard({
  title,
  eyebrow,
  icon,
  status,
  children,
}: SettingsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-elevated">
            {icon}
          </div>

          <div>
            <h2 className="text-[15px] font-semibold">{title}</h2>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
              {eyebrow}
            </p>
          </div>
        </div>

        {status}
      </div>

      <div className="mt-5">{children}</div>
    </Card>
  );
}
