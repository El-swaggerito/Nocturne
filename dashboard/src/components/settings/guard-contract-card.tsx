import { Badge } from "@/components/ui/badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { settingsDemoData } from "@/data/demo-settings";
import { ShieldCheck } from "lucide-react";

export function GuardContractCard() {
  const contract = settingsDemoData.contract;

  return (
    <SettingsCard
      title="Guard Contract"
      eyebrow="NEAR Rust Smart Contract"
      icon={<ShieldCheck size={16} className="text-cyan" />}
      status={
        <Badge variant="success">
          {contract.frozen ? "Frozen" : "Unfrozen"}
        </Badge>
      }
    >
      <div className="rounded-control bg-elevated p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
          Contract Account
        </p>

        <p className="font-technical mt-1 text-[10px]">
          {contract.accountId}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-[9px] text-muted">Contract Version</span>

          <span className="font-technical text-[9px] text-faint">
            {contract.version}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <MethodGroup
          label="Owner Authority"
          description="Owner signer required"
          methods={contract.ownerMethods}
          tone="primary"
        />

        <MethodGroup
          label="Agent Scope"
          description="Restricted function-call key"
          methods={contract.agentMethods}
          tone="cyan"
        />

        <MethodGroup
          label="Public Views"
          description="Read-only queries"
          methods={contract.viewMethods}
          tone="neutral"
        />
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted">
        Contract permissions are enforced by predecessor account and contract
        logic. The frontend cannot grant itself policy authority.
      </p>
    </SettingsCard>
  );
}

function MethodGroup({
  label,
  description,
  methods,
  tone,
}: {
  label: string;
  description: string;
  methods: string[];
  tone: "primary" | "cyan" | "neutral";
}) {
  const colour =
    tone === "primary"
      ? "text-primary"
      : tone === "cyan"
        ? "text-cyan"
        : "text-muted";

  return (
    <div className="rounded-control bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-medium ${colour}`}>
          {label}
        </span>

        <span className="text-[8px] text-muted">{description}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {methods.map((method) => (
          <code
            key={method}
            className="font-technical rounded bg-elevated px-2 py-1 text-[9px]"
          >
            {method}
          </code>
        ))}
      </div>
    </div>
  );
}
