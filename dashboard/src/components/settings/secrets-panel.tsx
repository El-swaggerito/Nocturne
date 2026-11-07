import { ShieldCheck } from "lucide-react";

const items = [
  {
    title: "Owner Credentials",
    description:
      "Owner private keys remain inside the external wallet or hardware signer.",
  },
  {
    title: "Agent Signing Secret",
    description:
      "The restricted agent signing secret must remain outside the client UI.",
  },
  {
    title: "Inference Credentials",
    description:
      "AI provider credentials belong in server-side infrastructure, never browser bundles.",
  },
  {
    title: "Public Transparency",
    description:
      "Public account IDs, contract state and RPC endpoints may be displayed without exposing signing authority.",
  },
];

export function SecretsPanel() {
  return (
    <section className="rounded-card border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={17} className="text-cyan" />

        <h2 className="text-[15px] font-semibold">
          Secrets are never displayed or stored in Nocturne
        </h2>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-control border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan" />
              <h3 className="text-[11px] font-semibold">{item.title}</h3>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-muted">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
