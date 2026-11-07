import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { settingsDemoData } from "@/data/demo-settings";

export function SecurityConfigurationCard() {
  return (
    <SettingsCard
      title="Security Configuration"
      eyebrow="Guardrail Checklist"
      icon={<ShieldCheck size={16} className="text-primary" />}
      status={
        <Badge variant="cyan">
          {settingsDemoData.security.length}/
          {settingsDemoData.security.length} configured
        </Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {settingsDemoData.security.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between gap-3 rounded-control bg-elevated p-2.5"
          >
            <span className="text-[10px] text-muted">{item}</span>

            <CheckCircle2 size={13} className="shrink-0 text-cyan" />
          </div>
        ))}
      </div>

      <p className="mt-4 text-[9px] text-faint">
        Configuration summary only. Live state verification will be connected
        to contract view calls later.
      </p>
    </SettingsCard>
  );
}
