import { NextResponse } from "next/server";

import { createServerPaymentClient } from "@/lib/agent-server";

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

  try {
    const proposal = (body as { proposal: unknown }).proposal;
    const client = createServerPaymentClient();
    const result = await client.submit(proposal);

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "payment_submission_failed" },
      { status: 500 },
    );
  }
}
