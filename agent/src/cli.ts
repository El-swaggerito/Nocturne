import { readFile } from "node:fs/promises";
import { ConfigurationError } from "./config.js";
import { extractInvoiceProposal, InferenceError } from "./inference.js";
import { InvoiceValidationError } from "./types.js";

async function main(): Promise<void> {
  const invoicePath = process.argv[2];
  if (!invoicePath) {
    throw new InferenceError("Provide a local invoice text fixture path. Example: fixtures/valid-invoice.txt");
  }
  const invoice = await readFile(invoicePath, "utf8");
  const proposal = await extractInvoiceProposal(invoice);
  // This is only a local smoke test for a PUBLIC SAMPLE invoice.
  console.log(JSON.stringify({ status: "validated", proposal }, null, 2));
  console.log("No payment was initiated.");
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
    console.error("Invoice smoke test failed.");
  }

  process.exitCode = 1;
});

