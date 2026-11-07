import { AppShell } from "@/components/layout/app-shell";
import { PaymentMetrics } from "@/components/payments/payment-metrics";
import { PaymentsWorkspace } from "@/components/payments/payments-workspace";
import { SettlementGuide } from "@/components/payments/settlement-guide";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  return (
    <AppShell
      activeSection="payments"
      title="Payments"
      subtitle="Review payment proposals, stored contract records and settlement outcomes."
    >
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Payments
              </h1>

              <Badge variant="cyan">
                Demonstration Data
              </Badge>
            </div>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Review contract payment records alongside policy-rejected demo
              attempts and settlement state.
            </p>
          </div>
        </section>

        <PaymentMetrics />

        <PaymentsWorkspace />

        <SettlementGuide />
      </div>
    </AppShell>
  );
}
