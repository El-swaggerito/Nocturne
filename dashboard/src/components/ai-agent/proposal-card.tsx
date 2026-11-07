import { CheckCircle2, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceSample } from "@/data/demo-ai-agent";

export function ProposalCard({
  sample,
}: {
  sample: InvoiceSample;
}) {
  const payload = {
    request_id: sample.requestId,
    recipient_id: sample.recipientId,
    amount_yocto: sample.amountYocto,
    invoice_reference: sample.invoiceReference,
  };

  return (
    <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Stage 02
          </span>
          <h2 className="text-[15px] font-semibold">AI Invoice Analysis</h2>
        </div>

        <Badge variant={sample.recipientApproved ? "primary" : "danger"}>
          {sample.recipientApproved ? "Proposal Drafted" : "Adversarial Output"}
        </Badge>
      </div>

      <div className="space-y-2 rounded-control bg-elevated p-3">
        <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
          <span className="text-[11px] text-muted">Invoice Reference</span>
          <span className="font-technical text-[10px]">
            {sample.invoiceReference}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
          <span className="text-[11px] text-muted">Detected Recipient</span>
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={
                sample.recipientApproved
                  ? "font-technical truncate text-[10px] text-cyan"
                  : "font-technical truncate text-[10px] text-danger"
              }
            >
              {sample.recipientId}
            </span>

            {sample.recipientApproved && (
              <CheckCircle2 size={13} className="shrink-0 text-cyan" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
          <span className="text-[11px] text-muted">Proposed Amount</span>
          <span className="font-technical text-lg font-medium">
            {sample.amountNear}{" "}
            <span className="text-[10px] text-muted">NEAR</span>
          </span>
        </div>

        <div className="rounded bg-card px-2.5 py-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">
            Exact YoctoNEAR
          </span>
          <p className="font-technical mt-1 break-all text-[10px] text-primary">
            {sample.amountYocto}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded bg-card px-2.5 py-2">
          <span className="text-[11px] text-muted">Extraction Confidence</span>
          <span className="font-technical text-[10px] text-cyan">
            {sample.confidence}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            request_payment payload
          </span>
          <span className="font-technical text-[9px] text-muted">
            proposal.json
          </span>
        </div>

        <pre className="font-technical flex-1 overflow-x-auto rounded-control border border-border bg-elevated p-3 text-[10px] leading-5 text-muted">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      <div className="flex items-start gap-2 rounded-control bg-elevated p-3 text-[11px] leading-4">
        <Info size={15} className="mt-0.5 shrink-0 text-cyan" />
        <p>
          <strong className="font-medium text-cyan">
            Extraction is not authorisation.
          </strong>{" "}
          This object is only a payment proposal.
        </p>
      </div>

      <Button variant="secondary" className="w-full">
        Submit Payment Proposal to Guard
      </Button>
    </section>
  );
}
