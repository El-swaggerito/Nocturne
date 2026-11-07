import {
  Bot,
  CircleCheckBig,
  Gavel,
  ListChecks,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Proposal Submission",
    description:
      "Agent submits request_payment using its restricted function-call key.",
    icon: Bot,
  },
  {
    number: "02",
    title: "Agent Verification",
    description:
      "Guard verifies the authorised agent account before evaluating payment policy.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "Recipient Allowlist",
    description:
      "Requested recipient must exist in the approved recipient set.",
    icon: ListChecks,
  },
  {
    number: "04",
    title: "Spending Limits",
    description:
      "Amount must satisfy per-transaction and remaining UTC daily allowance.",
    icon: WalletCards,
  },
  {
    number: "05",
    title: "Freeze Status",
    description:
      "Guard must be unfrozen before a new transfer can be scheduled.",
    icon: Gavel,
  },
];

export function EnforcementFlow() {
  return (
    <section className="rounded-card border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">
        How Nocturne enforces spending policy
      </h2>

      <p className="mt-1 text-xs text-muted">
        Contract checks applied before transfer scheduling.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {steps.map(({ number, title, description, icon: Icon }) => (
          <div
            key={number}
            className="flex min-h-[180px] flex-col justify-between rounded-control bg-elevated p-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-technical text-lg text-primary">
                  {number}
                </span>

                <Icon size={16} className="text-muted" />
              </div>

              <h3 className="mt-4 text-[13px] font-semibold">{title}</h3>

              <p className="mt-2 text-[10px] leading-4 text-muted">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-control bg-elevated p-3">
        <CircleCheckBig size={16} className="shrink-0 text-cyan" />

        <p className="text-xs">
          Only requests satisfying every applicable contract check may proceed
          to transfer settlement.
        </p>
      </div>
    </section>
  );
}
