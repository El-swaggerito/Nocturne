import { Info, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { InvoiceAnalysisResult } from "@/lib/agent-api";
import type { AgentPaymentResult } from "@/lib/payment-api";
import {
  getTransactionExplorerUrl,
  shortenHash,
} from "@/lib/explorer";

type ProposalCardProps = {
  analysis: InvoiceAnalysisResult | null;
  paymentResult: AgentPaymentResult | null;
  submitting: boolean;
  reconciling: boolean;
  paymentError: string | null;
  onSubmit: () => void;
  onReconcile: () => void;
};

export function ProposalCard({
  analysis,
  paymentResult,
  submitting,
  reconciling,
  paymentError,
  onSubmit,
  onReconcile,
}: ProposalCardProps) {
  if (!analysis) {
    return (
      <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
        <Header badge="Awaiting Analysis" />

        <div className="flex flex-1 items-center justify-center rounded-control border border-dashed border-border bg-elevated p-6 text-center">
          <div>
            <p className="text-sm font-medium">
              No proposal yet
            </p>

            <p className="mt-2 max-w-xs text-[10px] leading-4 text-muted">
              Analyse the untrusted invoice first. Extracted fields will appear
              here as a proposal only, not as an authorised payment.
            </p>
          </div>
        </div>

        <TrustNotice />
      </section>
    );
  }

  if (analysis.status === "validation-error") {
    return (
      <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
        <Header badge="Validation Error" danger />

        <div className="flex items-start gap-3 rounded-control bg-danger-bg p-4">
          <TriangleAlert
            size={16}
            className="mt-0.5 shrink-0 text-danger"
          />

          <div>
            <p className="text-xs font-medium text-danger">
              Invoice proposal not created
            </p>

            <p className="mt-1 text-[10px] leading-4 text-muted">
              {analysis.message}
            </p>
          </div>
        </div>

        <div className="rounded-control border border-border bg-elevated p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
            NEAR AI Private TEE
          </p>

          <p className="mt-1 text-[10px] leading-4 text-muted">
            This result came from the local Issue #13 extraction adapter.
            No blockchain transaction was created or submitted.
          </p>
        </div>

        <div className="flex-1" />

        <TrustNotice />
      </section>
    );
  }

  const { proposal } = analysis;

  const payload = {
    recipient_id: proposal.recipientId,
    amount_yocto: proposal.amountYocto,
    invoice_reference: proposal.invoiceReference,
  };

  return (
    <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
      <Header badge="Verified Proposal Created" />

      <div className="rounded-control border border-border bg-background p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
          NEAR AI Private TEE
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted">
          These fields were extracted locally. They have not been authorised
          by the Guard or submitted by the restricted agent.
        </p>
      </div>

      <div className="space-y-2 rounded-control bg-elevated p-3">
        <ProposalValue
          label="Invoice Reference"
          value={proposal.invoiceReference}
        />

        <ProposalValue
          label="Detected Recipient"
          value={proposal.recipientId}
        />

        <ProposalValue
          label="Proposed Amount"
          value={proposal.amountNear + " NEAR"}
        />

        <div className="rounded bg-card px-2.5 py-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">
            Exact YoctoNEAR
          </span>

          <p className="font-technical mt-1 break-all text-[10px] text-primary">
            {proposal.amountYocto}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Proposed payment fields
          </span>

          <span className="font-technical text-[9px] text-muted">
            proposal.json
          </span>
        </div>

        <pre className="font-technical flex-1 overflow-x-auto rounded-control border border-border bg-elevated p-3 text-[10px] leading-5 text-muted">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      <TrustNotice />

      <div className="space-y-3 rounded-control border border-border bg-elevated p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Restricted Agent Submission
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            Submission uses the server-side restricted agent key. The browser never receives signing credentials.
          </p>
        </div>

        {paymentError ? (
          <p className="rounded bg-danger-bg px-3 py-2 text-[10px] text-danger">
            {paymentError}
          </p>
        ) : null}

        {paymentResult ? (
          <div className="space-y-2 rounded bg-card p-3">
            <ProposalValue label="Status" value={paymentResult.status} />
            {paymentResult.requestId ? (
              <ProposalValue label="Request ID" value={paymentResult.requestId} />
            ) : null}
            {paymentResult.transactionHash ? (
              <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
                <span className="text-[11px] text-muted">
                  Transaction Hash
                </span>

                <a
                  href={getTransactionExplorerUrl(
                    paymentResult.transactionHash,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  title={paymentResult.transactionHash}
                  className="font-technical min-w-0 truncate text-[10px] text-cyan hover:underline"
                >
                  {shortenHash(
                    paymentResult.transactionHash,
                  )}
                </a>
              </div>
            ) : null}
            {paymentResult.reason ? (
              <ProposalValue label="Chain Result" value={paymentResult.reason} />
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || reconciling || paymentResult !== null}
            className="rounded-control bg-primary px-3 py-2 text-[10px] font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : paymentResult ? "Submission Recorded" : "Submit via Restricted Agent"}
          </button>

          {paymentResult?.status === "pending" && paymentResult.transactionHash ? (
            <button
              type="button"
              onClick={onReconcile}
              disabled={submitting || reconciling}
              className="rounded-control border border-border bg-card px-3 py-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reconciling ? "Reconciling..." : "Refresh Settlement"}
            </button>
          ) : null}
        </div>

        {paymentResult?.status === "pending" && !paymentResult.transactionHash ? (
          <p className="text-[9px] leading-4 text-muted">
            Outcome is not yet independently verifiable. No automatic resend will occur.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Header({
  badge,
  danger = false,
}: {
  badge: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Stage 02
        </span>

        <h2 className="text-[15px] font-semibold">
          AI Invoice Analysis
        </h2>
      </div>

      <Badge variant={danger ? "danger" : "primary"}>
        {badge}
      </Badge>
    </div>
  );
}

function ProposalValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
      <span className="text-[11px] text-muted">
        {label}
      </span>

      <span
        className="font-technical min-w-0 truncate text-[10px]"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function TrustNotice() {
  return (
    <div className="flex items-start gap-2 rounded-control bg-elevated p-3 text-[11px] leading-4">
      <Info
        size={15}
        className="mt-0.5 shrink-0 text-cyan"
      />

      <p>
        <strong className="font-medium text-cyan">
          Extraction is not authorisation.
        </strong>{" "}
        The proposal cannot alter Guard policy or gain owner permissions.
      </p>
    </div>
  );
}
