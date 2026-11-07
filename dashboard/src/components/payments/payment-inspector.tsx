import {
  CheckCircle2,
  CircleX,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DemoPaymentRecord } from "@/data/demo-payments";

export function PaymentInspector({
  record,
}: {
  record: DemoPaymentRecord | null;
}) {
  if (!record) {
    return (
      <aside className="rounded-card border border-border bg-card p-5 2xl:w-[420px] 2xl:shrink-0">
        <p className="text-sm font-medium">Select a payment</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Choose a row to inspect its demo payment details.
        </p>
      </aside>
    );
  }

  const isRejected = record.status === "policy-rejected";

  return (
    <aside className="rounded-card border border-border bg-card p-5 2xl:w-[420px] 2xl:shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-technical max-w-[260px] truncate text-xs font-medium">
            {record.requestId}
          </p>

          <p className="mt-1 text-[10px] text-muted">
            {isRejected
              ? "Agent / transaction failure record"
              : "Contract payment record"}
          </p>
        </div>

        <Badge variant={isRejected ? "danger" : record.status === "confirmed" ? "success" : record.status === "pending" ? "warning" : "neutral"}>
          {record.status === "confirmed"
            ? "Confirmed"
            : record.status === "pending"
              ? "Pending"
              : record.status === "failed"
                ? "Transfer Failed"
                : "Policy Rejected"}
        </Badge>
      </div>

      <section className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {isRejected
            ? "UI Failure Record"
            : "Persistent Contract Fields"}
        </p>

        <div className="mt-2 space-y-2 rounded-control bg-elevated p-3">
          {!isRejected && (
            <DetailRow label="Request ID" value={record.requestId} />
          )}

          <DetailRow
            label="Invoice Reference"
            value={record.invoiceReference}
          />

          <DetailRow
            label="Recipient"
            value={record.recipient}
            accent
          />

          <DetailRow
            label="Amount"
            value={`${record.amountNear} NEAR`}
          />

          <DetailRow
            label="Exact yoctoNEAR"
            value={record.amountYocto}
          />

          {!isRejected && (
            <DetailRow
              label="UTC Accounting Day"
              value={record.utcDay}
            />
          )}

          <DetailRow
            label="Status"
            value={
              record.status === "policy-rejected"
                ? "Policy Rejected"
                : record.status === "failed"
                  ? "Failed"
                  : record.status[0].toUpperCase() +
                    record.status.slice(1)
            }
          />
        </div>
      </section>

      {isRejected ? (
        <section className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Rejection Source
          </p>

          <div className="mt-2 rounded-control border border-danger/20 bg-danger-bg p-3">
            <div className="flex items-start gap-2">
              <CircleX size={15} className="mt-0.5 shrink-0 text-danger" />

              <div>
                <p className="text-[11px] font-medium text-danger">
                  Contract call rejected before payment record creation
                </p>

                <p className="mt-1 text-[10px] leading-4 text-muted">
                  {record.rejectionReason}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-control bg-elevated p-3 text-[10px] leading-4 text-muted">
            <Info size={14} className="mt-0.5 shrink-0 text-cyan" />
            <p>
              The current Guard does not persist policy-rejected proposals in
              its payment map. This entry represents demo agent or transaction
              failure telemetry.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Current Policy Context
              </p>

              <span className="font-technical text-[9px] text-cyan">
                Not stored per-payment
              </span>
            </div>

            <div className="mt-2 space-y-2">
              <PolicyRow
                label="Recipient Allowlist"
                value="Current recipient is approved"
              />

              <PolicyRow
                label="Per-Transaction Limit"
                value={`${record.amountNear} ≤ 5.00 NEAR`}
              />

              <PolicyRow
                label="UTC Daily Limit"
                value="Current policy: 10.00 NEAR"
              />

              <PolicyRow
                label="Freeze Status"
                value="Current state: Unfrozen"
              />

              <PolicyRow
                label="Agent Permission"
                value="request_payment only"
              />
            </div>

            <p className="mt-2 text-[9px] leading-4 text-faint">
              These are current demo policy values and are not an immutable
              historical policy snapshot.
            </p>
          </section>

          <section className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Settlement
            </p>

            <div className="mt-2 rounded-control bg-elevated p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  Settlement State
                </span>

                <span className="font-technical text-[9px] text-cyan">
                  {record.status === "confirmed"
                    ? "Confirmed"
                    : record.status === "pending"
                      ? "Pending"
                      : "Failed"}
                </span>
              </div>

              {record.transactionHash && (
                <div className="mt-3">
                  <p className="text-[10px] text-muted">
                    Demonstration transaction reference
                  </p>

                  <div className="font-technical mt-1 flex items-center justify-between gap-3 rounded bg-card p-2 text-[9px]">
                    <span>{record.transactionHash}</span>
                    <ExternalLink size={12} className="text-cyan" />
                  </div>

                  <p className="mt-1 text-[9px] text-faint">
                    Demo value only. Explorer link will be enabled for real
                    testnet transactions.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="mt-5 rounded-control bg-elevated p-3">
            <div className="flex items-center gap-2 text-cyan">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Callback Settlement
              </span>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-muted">
              Confirmed means the contract callback recorded transfer success.
              Failed means the callback recorded transfer failure and reconciled
              the reservation according to the Guard accounting rules.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}

function DetailRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-[10px] text-muted">{label}</span>

      <span
        className={
          accent
            ? "font-technical max-w-[65%] break-words text-right text-[9px] text-cyan"
            : "font-technical max-w-[65%] break-words text-right text-[9px]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PolicyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control bg-elevated p-2.5">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-cyan" />
        <span className="text-[10px]">{label}</span>
      </div>

      <span className="font-technical max-w-[55%] text-right text-[9px] text-muted">
        {value}
      </span>
    </div>
  );
}
