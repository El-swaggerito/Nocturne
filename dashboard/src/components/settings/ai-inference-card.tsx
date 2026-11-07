import { BrainCircuit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { settingsDemoData } from "@/data/demo-settings";

export function AiInferenceCard() {
  const ai = settingsDemoData.ai;

  const rows = [
    ["Inference Provider", ai.provider],
    ["Model Status", ai.status],
    ["Invoice Extraction", ai.extraction],
    ["Payment Authority", ai.authority],
  ];

  return (
    <SettingsCard
      title="AI Inference Pipeline"
      eyebrow="Proposal Engine"
      icon={<BrainCircuit size={16} className="text-primary" />}
      status={<Badge variant="neutral">Demo</Badge>}
    >
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-control bg-background p-2.5"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-muted">
              {label}
            </p>

            <p
              className={
                label === "Payment Authority"
                  ? "font-technical mt-1 text-[9px] text-danger"
                  : "font-technical mt-1 text-[9px]"
              }
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted">
        AI inference may extract and propose payment details. It cannot change
        policy or independently authorise a transfer.
      </p>
    </SettingsCard>
  );
}
