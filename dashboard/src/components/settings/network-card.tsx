import { Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsRow } from "@/components/settings/settings-row";
import { settingsDemoData } from "@/data/demo-settings";

export function NetworkCard() {
  const { network, owner, agent, contract } = settingsDemoData;

  return (
    <SettingsCard
      title="Public Network Configuration"
      eyebrow="External Public Infrastructure"
      icon={<Globe2 size={16} className="text-cyan" />}
      status={<Badge variant="neutral">Public</Badge>}
    >
      <div className="rounded-control bg-background px-3">
        <SettingsRow label="Network" value={network.name} />

        <SettingsRow
          label="Public RPC Host"
          value={network.rpcHost}
        />

        <SettingsRow
          label="Contract Account"
          value={<span className="text-cyan">{contract.accountId}</span>}
        />

        <SettingsRow label="Owner Account" value={owner.accountId} />

        <SettingsRow label="Agent Account" value={agent.accountId} />

        <SettingsRow
          label="Explorer Host"
          value={network.explorerHost}
        />
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted">
        The RPC and explorer hosts shown are public external services. They are
        not private Nocturne infrastructure and no credentials are embedded in
        these values.
      </p>
    </SettingsCard>
  );
}
