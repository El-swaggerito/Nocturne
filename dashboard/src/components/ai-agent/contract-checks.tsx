import {
  CheckCircle2,
  CircleHelp,
  CircleX,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { InvoiceAnalysisResult } from "@/lib/agent-api";
import type {
  PolicyView,
  SpendingView,
} from "@/lib/contract-types";
import { formatYoctoNear } from "@/lib/format-near";

type CheckState = "pass" | "reject" | "unknown";

type CheckRowProps = {
  label: string;
  detail: string;
  state: CheckState;
};

function CheckRow({
  label,
  detail,
  state,
}: CheckRowProps) {
  const passed = state === "pass";
  const rejected = state === "reject";

  return (
    <div className="flex items-start justify-between gap-3 rounded bg-card p-2.5">
      <div className="flex min-w-0 items-start gap-2">
        {passed ? (
          <CheckCircle2
            size={15}
            className="mt-0.5 shrink-0 text-cyan"
          />
        ) : rejected ? (
          <CircleX
            size={15}
            className="mt-0.5 shrink-0 text-danger"
          />
        ) : (
          <CircleHelp
            size={15}
            className="mt-0.5 shrink-0 text-muted"
          />
        )}

        <div className="min-w-0">
          <p className="text-[11px] font-medium">
            {label}
          </p>

          <p
            className={
              rejected
                ? "font-technical mt-0.5 break-words text-[9px] text-danger"
                : "font-technical mt-0.5 break-words text-[9px] text-muted"
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
            : rejected
              ? "text-[9px] font-semibold uppercase text-danger"
              : "text-[9px] font-semibold uppercase text-muted"
        }
      >
        {passed
          ? "Pass"
          : rejected
            ? "Reject"
            : "Unknown"}
      </span>
    </div>
  );
}

export function ContractChecks({
  analysis,
  configured,
  loading,
  error,
  policy,
  spending,
}: {
  analysis: InvoiceAnalysisResult | null;
  configured: boolean;
  loading: boolean;
  error: string | null;
  policy: PolicyView | null;
  spending: SpendingView | null;
}) {
  const proposal =
    analysis?.status === "proposal"
      ? analysis.proposal
      : null;

  const guardReady =
    configured &&
    !loading &&
    !error &&
    policy !== null &&
    spending !== null;

  const amountYocto = proposal
    ? BigInt(proposal.amountYocto)
    : null;

  const recipientApproved =
    proposal && policy
      ? policy.approved_recipients.includes(
          proposal.recipientId,
        )
      : null;

  const withinTransactionLimit =
    amountYocto !== null && policy
      ? amountYocto <=
        BigInt(policy.per_transaction_limit)
      : null;

  const withinDailyAllowance =
    amountYocto !== null && spending
      ? amountYocto <=
        BigInt(spending.remaining_daily)
      : null;

  const unfrozen = policy
    ? !policy.frozen
    : null;

  const accepted =
    guardReady &&
    proposal !== null &&
    recipientApproved === true &&
    withinTransactionLimit === true &&
    withinDailyAllowance === true &&
    unfrozen === true;

  const rejected =
    guardReady &&
    proposal !== null &&
    (
      recipientApproved === false ||
      withinTransactionLimit === false ||
      withinDailyAllowance === false ||
      unfrozen === false
    );

  const badge = accepted
    ? "Policy Eligible"
    : rejected
      ? "Policy Rejected"
      : "Awaiting Live Check";

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

        <Badge
          variant={
            rejected
              ? "danger"
              : accepted
                ? "cyan"
                : "warning"
          }
        >
          {badge}
        </Badge>
      </div>

      {!configured ? (
        <p className="text-[11px] text-muted">
          Guard contract is not configured. No live policy
          decision can be shown.
        </p>
      ) : error ? (
        <p className="text-[11px] text-danger">
          Live Guard state could not be loaded: {error}
        </p>
      ) : loading ? (
        <p className="text-[11px] text-muted">
          Loading live Guard policy from NEAR RPC.
        </p>
      ) : !proposal ? (
        <p className="text-[11px] text-muted">
          Analyse an invoice to produce a proposal before
          policy checks can be evaluated.
        </p>
      ) : null}

      <div className="space-y-2 rounded-control bg-elevated p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Live Policy Evaluation
        </p>

        <CheckRow
          label="Recipient Allowlist"
          detail={
            proposal && policy
              ? recipientApproved
                ? proposal.recipientId +
                  " is currently approved"
                : proposal.recipientId +
                  " is not currently approved"
              : "Live allowlist comparison unavailable"
          }
          state={
            recipientApproved === null
              ? "unknown"
              : recipientApproved
                ? "pass"
                : "reject"
          }
        />

        <CheckRow
          label="Per-Transaction Limit"
          detail={
            proposal && policy
              ? proposal.amountNear +
                " NEAR compared with current limit " +
                formatYoctoNear(
                  policy.per_transaction_limit,
                ) +
                " NEAR"
              : "Live transaction limit comparison unavailable"
          }
          state={
            withinTransactionLimit === null
              ? "unknown"
              : withinTransactionLimit
                ? "pass"
                : "reject"
          }
        />

        <CheckRow
          label="UTC Daily Allowance"
          detail={
            proposal && spending
              ? proposal.amountNear +
                " NEAR compared with remaining allowance " +
                formatYoctoNear(
                  spending.remaining_daily,
                ) +
                " NEAR"
              : "Live daily allowance comparison unavailable"
          }
          state={
            withinDailyAllowance === null
              ? "unknown"
              : withinDailyAllowance
                ? "pass"
                : "reject"
          }
        />

        <CheckRow
          label="Freeze Status"
          detail={
            policy
              ? policy.frozen
                ? "Guard is currently frozen"
                : "Guard is currently unfrozen"
              : "Live freeze state unavailable"
          }
          state={
            unfrozen === null
              ? "unknown"
              : unfrozen
                ? "pass"
                : "reject"
          }
        />

        <CheckRow
          label="Agent Permission"
          detail="Restricted agent-key permissions are verified separately during testnet integration."
          state="unknown"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between rounded-control border border-border bg-elevated p-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Evaluation Result
            </span>

            <Badge
              variant={
                rejected
                  ? "danger"
                  : accepted
                    ? "warning"
                    : "warning"
              }
            >
              {accepted
                ? "Eligible Proposal"
                : rejected
                  ? "Would Be Rejected"
                  : "Not Evaluated"}
            </Badge>
          </div>

          <div className="font-technical mt-4 space-y-2 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-muted">
                Proposal
              </span>
              <span>
                {proposal
                  ? "Extracted"
                  : "None"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted">
                Transaction submitted
              </span>
              <span>No</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted">
                On-chain payment record
              </span>
              <span>None created by this screen</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[10px] leading-4 text-muted">
          <ShieldCheck
            size={14}
            className="mt-0.5 shrink-0 text-cyan"
          />

          <p>
            This is a client-side preview using live Guard
            state. The contract remains authoritative when
            request_payment is actually called.
          </p>
        </div>
      </div>
    </section>
  );
}
