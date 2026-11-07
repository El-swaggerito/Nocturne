import { Badge } from "@/components/ui/badge";

const stages = [
  {
    number: "01",
    title: "Invoice Input",
    description: "Untrusted raw data",
    variant: "neutral" as const,
  },
  {
    number: "02",
    title: "AI Invoice Analysis",
    description: "Payment proposal",
    variant: "primary" as const,
  },
  {
    number: "03",
    title: "Contract Policy Checks",
    description: "Authoritative decision",
    variant: "cyan" as const,
  },
];

export function PipelineSteps() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stages.map((stage) => (
        <div
          key={stage.number}
          className="flex items-center justify-between gap-3 rounded-control border border-border bg-card p-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-technical flex size-6 items-center justify-center rounded bg-elevated text-[10px]">
              {stage.number}
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {stage.title}
            </span>
          </div>

          <Badge variant={stage.variant}>{stage.description}</Badge>
        </div>
      ))}
    </div>
  );
}
