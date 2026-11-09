"use client";

import { useState } from "react";

import { useGuardState } from "@/hooks/use-guard-state";

import { ContractChecks } from "@/components/ai-agent/contract-checks";
import { InvoiceIntake } from "@/components/ai-agent/invoice-intake";
import { PipelineBanner } from "@/components/ai-agent/pipeline-banner";
import { PipelineSteps } from "@/components/ai-agent/pipeline-steps";
import { PromptInjectionDemo } from "@/components/ai-agent/prompt-injection-demo";
import { ProposalCard } from "@/components/ai-agent/proposal-card";
import {
  invoiceSamples,
  type SampleKey,
} from "@/data/demo-ai-agent";
import {
  demoInvoiceAgent,
  type InvoiceAnalysisResult,
} from "@/lib/agent-api";

export function AiAgentWorkspace() {
  const {
    data: guardData,
    configured,
    loading: guardLoading,
    error: guardError,
  } = useGuardState();

  const [activeSample, setActiveSample] =
    useState<SampleKey>("aws");

  const [invoiceText, setInvoiceText] = useState(
    invoiceSamples.aws.raw,
  );

  const [analysis, setAnalysis] =
    useState<InvoiceAnalysisResult | null>(null);

  const [analysing, setAnalysing] = useState(false);


  function selectSample(key: SampleKey) {
    setActiveSample(key);
    setInvoiceText(invoiceSamples[key].raw);
    setAnalysis(null);
  }

  async function analyseInvoice() {
    if (analysing) {
      return;
    }

    setAnalysing(true);
    setAnalysis(null);

    try {
      const result =
        await demoInvoiceAgent.analyseInvoice(invoiceText);

      setAnalysis(result);
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <div className="space-y-4">
      <PipelineBanner />
      <PipelineSteps />

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <InvoiceIntake
          activeKey={activeSample}
          invoiceText={invoiceText}
          analysing={analysing}
          onInvoiceTextChange={(value) => {
            setInvoiceText(value);
            setAnalysis(null);
          }}
          onSampleChange={selectSample}
          onAnalyse={() => void analyseInvoice()}
        />

        <ProposalCard analysis={analysis} />

        <ContractChecks
          analysis={analysis}
          configured={configured}
          loading={guardLoading}
          error={guardError}
          policy={guardData?.policy ?? null}
          spending={guardData?.spending ?? null}
        />
      </div>

      <PromptInjectionDemo />
    </div>
  );
}
