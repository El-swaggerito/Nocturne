import { Badge } from "@/components/ui/badge";
import type { PaymentStatus as PaymentStatusType } from "@/data/demo-overview";

const config = {
  confirmed: {
    label: "Confirmed",
    variant: "success" as const,
  },
  pending: {
    label: "Pending",
    variant: "warning" as const,
  },
  "policy-rejected": {
    label: "Policy Rejected",
    variant: "danger" as const,
  },
  failed: {
    label: "Failed",
    variant: "neutral" as const,
  },
};

export function PaymentStatus({
  status,
}: {
  status: PaymentStatusType;
}) {
  const item = config[status];

  return (
    <Badge variant={item.variant}>
      <span className="size-1.5 rounded-full bg-current" />
      {item.label}
    </Badge>
  );
}
