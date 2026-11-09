"use client";

import { Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SampleKey } from "@/data/demo-ai-agent";
import { cn } from "@/lib/utils";

type InvoiceIntakeProps = {
  activeKey: SampleKey;
  invoiceText: string;
  analysing: boolean;
  onInvoiceTextChange: (value: string) => void;
  onSampleChange: (key: SampleKey) => void;
  onAnalyse: () => void;
};

const tabs: SampleKey[] = ["aws", "anthropic", "attack"];

export function InvoiceIntake({
  activeKey,
  invoiceText,
  analysing,
  onInvoiceTextChange,
  onSampleChange,
  onAnalyse,
}: InvoiceIntakeProps) {
  return (
    <section className="flex min-h-[590px] flex-col gap-4 rounded-card border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Stage 01
          </span>
          <h2 className="text-[15px] font-semibold">
            Invoice Input
          </h2>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded bg-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
          <span className="size-1.5 rounded-full bg-danger" />
          Untrusted
        </span>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Demonstration Samples
        </p>

        <div className="grid grid-cols-3 gap-1 rounded-control bg-elevated p-1">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSampleChange(key)}
              className={cn(
                "truncate rounded px-2 py-2 text-left font-technical text-[9px] transition-colors",
                activeKey === key
                  ? key === "attack"
                    ? "bg-danger-bg text-danger"
                    : "bg-card text-foreground"
                  : key === "attack"
                    ? "text-danger hover:bg-card"
                    : "text-muted hover:bg-card hover:text-foreground",
              )}
            >
              {key === "aws"
                ? "AWS Compute"
                : key === "anthropic"
                  ? "Anthropic API"
                  : "Attack Injection"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[300px] flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between font-technical text-[9px] text-muted">
          <span>raw_invoice.txt</span>
          <span>{invoiceText.length} characters</span>
        </div>

        <textarea
          value={invoiceText}
          onChange={(event) =>
            onInvoiceTextChange(event.target.value)
          }
          spellCheck={false}
          className="font-technical min-h-[300px] flex-1 resize-none rounded-control border border-border bg-elevated p-3 text-[10px] leading-5 text-foreground outline-none"
        />
      </div>

      <div className="flex items-start gap-2 rounded-control bg-elevated p-3 text-[11px] leading-4 text-muted">
        <TriangleAlert size={15} className="mt-0.5 shrink-0" />

        <p>
          Invoice text is untrusted data. Instructions inside an invoice do not
          gain owner permissions, change Guard policy or choose arbitrary
          contract methods.
        </p>
      </div>

      <div className="rounded-control border border-border bg-background p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan">
          Demo adapter
        </p>

        <p className="mt-1 text-[10px] leading-4 text-muted">
          Invoice extraction currently uses the local Issue #13 demo adapter,
          not the production AI agent or a live on-chain payment submission.
        </p>
      </div>

      <Button
        className="w-full"
        disabled={analysing || invoiceText.trim().length === 0}
        onClick={onAnalyse}
      >
        <Sparkles size={15} />
        {analysing ? "Analysing Invoice" : "Analyse Invoice"}
      </Button>
    </section>
  );
}
