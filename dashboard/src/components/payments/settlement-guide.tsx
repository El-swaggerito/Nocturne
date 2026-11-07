import {
  Ban,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

const items = [
  {
    title: "Reservation-Based Accounting",
    description:
      "Pending requests reserve daily allowance before transfer settlement.",
    icon: LockKeyhole,
    tone: "text-primary",
  },
  {
    title: "Callback Reconciliation",
    description:
      "Confirmed and failed outcomes are recorded by the asynchronous settlement callback.",
    icon: RefreshCcw,
    tone: "text-cyan",
  },
  {
    title: "Duplicate IDs Rejected",
    description:
      "Previously recorded request IDs cannot be submitted again.",
    icon: Ban,
    tone: "text-cyan",
  },
  {
    title: "Contract-Enforced Policy",
    description:
      "Recipient, transaction limit, daily allowance and freeze checks happen before transfer scheduling.",
    icon: ShieldCheck,
    tone: "text-danger",
  },
];

export function SettlementGuide() {
  return (
    <section>
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" />
        <div>
          <h2 className="text-[15px] font-semibold">
            How Settlement Works
          </h2>
          <p className="mt-0.5 text-[10px] text-muted">
            Current Nocturne Guard accounting model
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map(({ title, description, icon: Icon, tone }) => (
          <div
            key={title}
            className="rounded-card border border-border bg-card p-4"
          >
            <div className={`flex size-8 items-center justify-center rounded-control bg-elevated ${tone}`}>
              <Icon size={16} />
            </div>

            <h3 className="mt-3 text-[13px] font-semibold">{title}</h3>

            <p className="mt-1 text-[10px] leading-4 text-muted">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
