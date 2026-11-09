import { CheckCircle2, CircleX, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AgentAccessCard({
  owner,
  agent,
}: {
  owner: string;
  agent: string;
}) {
  const denied = [
    "Policy modification",
    "Emergency Freeze control",
    "Recipient management",
    "Spending-limit changes",
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Agent Access</h2>
          <Badge variant="primary">Read-only view</Badge>
        </div>

        <span className="font-technical text-[9px] text-cyan">
          Contract Role
        </span>
      </div>

      <div className="mt-5 rounded-control bg-elevated p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
          Autonomous Agent Account
        </p>

        <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <span className="font-technical text-[10px] font-semibold">
            {agent}
          </span>

          <span className="font-technical rounded bg-background px-2 py-1 text-[9px] text-muted">
            Expected restricted function-call scope
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <PermissionRow
          allowed
          label="Allowed method"
          value="request_payment"
        />

        {denied.map((label) => (
          <PermissionRow
            key={label}
            allowed={false}
            label={label}
            value="Denied"
          />
        ))}
      </div>

      <div className="mt-4 rounded-control bg-elevated p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
          Owner Account
        </p>

        <p
          className="font-technical mt-1 break-all text-[10px]"
          title={owner}
        >
          {owner}
        </p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-[10px] leading-4 text-muted">
          Contract policy remains authoritative even if the agent behaves
          incorrectly.
        </p>

        <div className="mt-2 flex items-center gap-2 text-primary">
          <LockKeyhole size={13} />
          <span className="font-technical text-[9px]">
            No private signing keys are displayed in this UI.
          </span>
        </div>
      </div>
    </Card>
  );
}

function PermissionRow({
  allowed,
  label,
  value,
}: {
  allowed: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control bg-elevated p-2.5">
      <div className="flex items-center gap-2">
        {allowed ? (
          <CheckCircle2 size={14} className="text-cyan" />
        ) : (
          <CircleX size={14} className="text-danger" />
        )}

        <span className="text-[10px]">{label}</span>
      </div>

      <span
        className={
          allowed
            ? "font-technical text-[9px] text-cyan"
            : "font-technical text-[9px] text-danger"
        }
      >
        {value}
      </span>
    </div>
  );
}
