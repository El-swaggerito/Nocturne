import { Badge } from "@/components/ui/badge";
import type { PaymentUiStatus } from "@/data/demo-payments";

const config = {
  confirmed: {
    label: "Confirmed",
    variant: "success" as const,
  },
  pending: {
    label: "Pending",
    variant: "warning" as const,
  },
  failed: {
    label: "Transfer Failed",
    variant: "neutral" as const,
  },
  "policy-rejected": {
    label: "Policy Rejected",
    variant: "danger" as const,
  },
};

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentUiStatus;
}) {
  const item = config[status];

  return (
    <Badge variant={item.variant}>
      <span className="size-1.5 rounded-full bg-current" />
      {item.label}
    </Badge>
  );
}
