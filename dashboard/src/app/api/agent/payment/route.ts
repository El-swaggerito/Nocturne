import { NextResponse } from "next/server";

import { createServerPaymentClient } from "@/lib/agent-server";

type PaymentAction = "submit" | "reconcile";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("proposal" in body)
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  const parsed = body as {
    proposal: unknown;
    action?: unknown;
  };

  const action: PaymentAction =
    parsed.action === undefined ? "submit" :
    parsed.action === "submit" || parsed.action === "reconcile"
      ? parsed.action
      : "submit";

  if (
    parsed.action !== undefined &&
    parsed.action !== "submit" &&
    parsed.action !== "reconcile"
  ) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400 },
    );
  }

  try {
    const client = createServerPaymentClient();

    const result =
      action === "reconcile"
        ? await client.reconcile(parsed.proposal)
        : await client.submit(parsed.proposal);

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "payment_submission_failed" },
      { status: 500 },
    );
  }
}
