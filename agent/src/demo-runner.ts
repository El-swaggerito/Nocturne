import { readFile } from "node:fs/promises";
import {
  extractInvoiceProposal,
  loadNearPaymentConfig,
  createNearTestnetTransport,
  NearPaymentClient,
} from "./index.js";
import { ConfigurationError } from "./config.js";
import { InferenceError } from "./inference.js";
import { InvoiceValidationError } from "./types.js";

async function main(): Promise<void> {
  const invoicePath = process.argv[2];

  if (!invoicePath) {
    throw new Error(
      "Provide a fictional invoice fixture path. Example: ../demo/fixtures/s1-valid-invoice.txt",
    );
  }

  const invoice = await readFile(invoicePath, "utf8");

  const proposal = await extractInvoiceProposal(invoice);

  console.log(
    JSON.stringify(
      {
        layer: "ai",
        status: "validated",
        proposal,
      },
      null,
      2,
    ),
  );

  const config = loadNearPaymentConfig();
  const client = new NearPaymentClient(
    config,
    createNearTestnetTransport(),
  );

  const result = await client.submit(proposal);

  console.log(
    JSON.stringify(
      {
        layer: "chain",
        result,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  if (error instanceof InvoiceValidationError) {
    console.error(error.message);

    for (const issue of error.errors) {
      console.error(`- ${issue.field}: ${issue.code}`);
    }
  } else if (
    error instanceof ConfigurationError ||
    error instanceof InferenceError
  ) {
    console.error(error.message);
  } else {
    console.error("Demo payment runner failed.");
  }

  process.exitCode = 1;
});
