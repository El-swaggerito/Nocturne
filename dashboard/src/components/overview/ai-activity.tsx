import Link from "next/link";
import { ArrowRight, Bot, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type Proposal = {
  invoiceReference: string;
  recipient: string;
  amount: string;
  aiValidation: string;
  contractDecision: string;
};

type AiActivityProps = {
  agentId: string;
  proposal: Proposal;
};

export function AiActivity({
  agentId,
  proposal,
}: AiActivityProps) {
  return (
    <section className="rounded-card border border-border bg-card p-5 lg:col-span-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-cyan" />
          <h2 className="text-[15px] font-semibold">
            AI Agent Activity
          </h2>
        </div>

        <Badge variant="cyan">Demo</Badge>
      </div>

      <div className="font-technical mt-2 flex items-center gap-1.5 text-[10px] text-muted">
        <Bot size={13} />
        <span>{agentId}</span>
      </div>

      <div className="mt-5 rounded-card border border-border bg-elevated p-4">
        <div className="flex items-center justify-between">
          <Badge variant="warning">Proposal</Badge>
          <span className="font-technical text-[10px] text-muted">
            4m ago
          </span>
        </div>

        <dl className="font-technical mt-5 space-y-3 text-[10px]">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Invoice</dt>
            <dd className="font-semibold">
              {proposal.invoiceReference}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Recipient</dt>
            <dd className="max-w-[62%] text-right">
              {proposal.recipient}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Amount</dt>
            <dd className="font-semibold text-primary">
              {proposal.amount}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">AI Analysis</dt>
            <dd className="max-w-[62%] text-right text-cyan">
              {proposal.aiValidation}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Policy Preview</dt>
            <dd className="max-w-[62%] text-right text-cyan">
              {proposal.contractDecision}
            </dd>
          </div>
        </dl>

        <Link
          href="/ai-agent"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-control bg-primary px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Review in AI Agent
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-control border border-border bg-elevated/70 p-3 text-xs leading-5 text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-cyan" />

        <p>
          AI analysis does not authorise payment execution. Contract policy
          independently determines whether a submitted request can proceed.
        </p>
      </div>
    </section>
  );
}
