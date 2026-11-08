import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RecipientsCard({
  recipients,
}: {
  recipients: string[];
}) {
  return (
    <Card className="p-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            Approved Recipients
          </h2>

          <Badge variant="cyan">
            {recipients.length} active
          </Badge>
        </div>

        <p className="mt-1 text-xs text-muted">
          Only approved NEAR accounts can receive Guard transfers.
        </p>
      </div>

      <div className="relative mt-5">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />

        <input
          disabled
          placeholder="Recipient management is available in Issue #13"
          className="h-10 w-full rounded-control border border-border bg-elevated pl-9 pr-3 text-xs text-muted outline-none"
        />
      </div>

      <div className="mt-4 space-y-2">
        {recipients.length === 0 ? (
          <div className="rounded-control bg-elevated p-4 text-center">
            <p className="text-xs font-medium">
              No approved recipients
            </p>

            <p className="mt-1 text-[10px] text-muted">
              The Guard currently has an empty recipient allowlist.
            </p>
          </div>
        ) : (
          recipients.map((accountId) => (
            <div
              key={accountId}
              className="flex items-center justify-between gap-3 rounded-control bg-elevated p-3"
            >
              <span
                className="font-technical min-w-0 truncate text-[10px] font-medium"
                title={accountId}
              >
                {accountId}
              </span>

              <Badge variant="success">
                Approved
              </Badge>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 rounded-control bg-background p-3 text-[10px] leading-4 text-muted">
        Recipient changes require owner authorisation. This Issue #12 view is
        read-only.
      </p>
    </Card>
  );
}
