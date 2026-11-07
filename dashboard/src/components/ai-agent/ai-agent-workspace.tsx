"use client";

import { useState } from "react";

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

export function AiAgentWorkspace() {
  const [activeSample, setActiveSample] =
    useState<SampleKey>("aws");

  const sample = invoiceSamples[activeSample];

  return (
    <div className="space-y-4">
      <PipelineBanner />
      <PipelineSteps />

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <InvoiceIntake
          activeKey={activeSample}
          sample={sample}
          onSampleChange={setActiveSample}
        />

        <ProposalCard sample={sample} />
        <ContractChecks sample={sample} />
      </div>

      <PromptInjectionDemo />
    </div>
  );
}
