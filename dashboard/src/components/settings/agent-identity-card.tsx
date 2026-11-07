import { Bot, Gavel } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsRow } from "@/components/settings/settings-row";
import { settingsDemoData } from "@/data/demo-settings";

export function AgentIdentityCard() {
  const agent = settingsDemoData.agent;

  return (
    <SettingsCard
      title="AI Agent Identity"
      eyebrow="Cryptographic Delegate"
      icon={<Bot size={16} className="text-cyan" />}
      status={<Badge variant="primary">Restricted</Badge>}
    >
      <div className="rounded-control bg-elevated p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
          Agent Account
        </p>

        <p className="font-technical mt-1 text-[10px]">
          {agent.accountId}
        </p>
      </div>

      <div className="mt-4 rounded-control bg-background px-3">
        <SettingsRow label="Key Type" value={agent.keyType} />

        <SettingsRow
          label="Permitted Target"
          value={<span className="text-cyan">{agent.target}</span>}
        />

        <SettingsRow
          label="Allowed Method"
          value={agent.allowedMethod}
        />

        <SettingsRow
          label="Gas Allowance"
          value={agent.allowance}
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-control bg-background p-3">
        <Gavel size={14} className="mt-0.5 shrink-0 text-primary" />

        <p className="text-[10px] leading-4 text-muted">
          Function-call key allowance pays for invocation gas. It does not
          authorise treasury spending. Spending authority remains constrained
          by the Guard contract.
        </p>
      </div>
    </SettingsCard>
  );
}
