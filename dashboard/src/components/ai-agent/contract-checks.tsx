import {
  CheckCircle2,
  CircleX,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { InvoiceSample } from "@/data/demo-ai-agent";

type CheckRowProps = {
  label: string;
  detail: string;
  passed: boolean;
};

function CheckRow({
  label,
  detail,
  passed,
}: CheckRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded bg-card p-2.5">
      <div className="flex min-w-0 items-start gap-2">
        {passed ? (
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-cyan" />
        ) : (
          <CircleX size={15} className="mt-0.5 shrink-0 text-danger" />
        )}

        <div className="min-w-0">
          <p className="text-[11px] font-medium">{label}</p>
          <p
            className={
              passed
                ? "font-technical mt-0.5 break-words text-[9px] text-muted"
                : "font-technical mt-0.5 break-words text-[9px] text-danger"
            }
          >
            {detail}
          </p>
        </div>
      </div>

      <span
        className={
          passed
            ? "text-[9px] font-semibold uppercase text-cyan"
            : "text-[9px] font-semibold uppercase text-danger"
        }
      >
        {passed ? "Pass" : "Reject"}
      </span>
    </div>
  );
}

export function ContractChecks({
  sample,
}: {
  sample: InvoiceSample;
}) {
  const accepted =
    sample.recipientApproved &&
    sample.withinTransactionLimit;

  return (
    <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Stage 03
          </span>
          <h2 className="text-[15px] font-semibold">
            Contract Policy Checks
          </h2>
        </div>

        <Badge variant={accepted ? "cyan" : "danger"}>
          {accepted ? "Policy Eligible" : "Policy Rejected"}
        </Badge>
      </div>

      <p className="text-[11px] text-muted">
        Guard contract:{" "}
        <code className="font-technical text-primary">
          nocturne-guard.testnet
        </code>
      </p>

      <div className="space-y-2 rounded-control bg-elevated p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Authoritative Policy Checks
        </p>

        <CheckRow
          label="Recipient Allowlist"
          detail={
            sample.recipientApproved
              ? `${sample.recipientId} is approved`
              : `${sample.recipientId} is not approved`
          }
          passed={sample.recipientApproved}
        />

        <CheckRow
          label="Per-Transaction Limit"
          detail={`${sample.amountNear} NEAR ${
            sample.withinTransactionLimit ? "≤" : ">"
          } 5.00 NEAR`}
          passed={sample.withinTransactionLimit}
        />

        <CheckRow
          label="UTC Daily Allowance"
          detail={
            accepted
              ? "Current demo allowance can accommodate this proposal"
              : "Proposal must still satisfy remaining UTC daily allowance"
          }
          passed={accepted}
        />

        <CheckRow
          label="Freeze Status"
          detail="Contract state: Unfrozen"
          passed
        />

        <CheckRow
          label="Agent Permission"
          detail="Restricted function-call access: request_payment"
          passed
        />
      </div>

      <div className="flex flex-1 flex-col justify-between rounded-control border border-border bg-elevated p-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Payment Result
            </span>

            <Badge variant={accepted ? "warning" : "danger"}>
              {accepted ? "Ready to Submit" : "Policy Rejected"}
            </Badge>
          </div>

          <div className="font-technical mt-4 space-y-2 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Request ID</span>
              <span className="max-w-[65%] truncate">{sample.requestId}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted">Settlement</span>
              <span>
                {accepted
                  ? "Not yet submitted"
                  : "No transfer scheduled"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted">Persistent contract record</span>
              <span>
                {accepted
                  ? "None yet"
                  : "None for policy rejection"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[10px] leading-4 text-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan" />
          <p>
            Demo evaluation only. No transaction has been signed or submitted.
          </p>
        </div>
      </div>
    </section>
  );
}
