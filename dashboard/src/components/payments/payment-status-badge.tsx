import { Badge } from "@/components/ui/badge";

export type PaymentStatus =
  | "confirmed"
  | "pending"
  | "failed";

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  if (status === "confirmed") {
    return <Badge variant="success">Confirmed</Badge>;
  }

  if (status === "pending") {
    return <Badge variant="warning">Pending</Badge>;
  }

  return <Badge variant="danger">Transfer Failed</Badge>;
}
