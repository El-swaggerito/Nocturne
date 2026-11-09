import { Badge } from "@/components/ui/badge";

export type PaymentStatusType =
  | "confirmed"
  | "pending"
  | "failed";

export function PaymentStatus({
  status,
}: {
  status: PaymentStatusType;
}) {
  if (status === "confirmed") {
    return <Badge variant="success">Confirmed</Badge>;
  }

  if (status === "pending") {
    return <Badge variant="warning">Pending</Badge>;
  }

  return <Badge variant="danger">Failed</Badge>;
}
