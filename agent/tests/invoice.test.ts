import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_NEAR_AI_MODEL, NEAR_AI_BASE_URL, type NearAIConfig } from "../src/config.js";
import { parseLabelledInvoice } from "../src/invoice.js";
import { extractInvoiceProposal, buildMessages, SYSTEM_PROMPT, type InferenceTransport } from "../src/inference.js";
import { InvoiceValidationError } from "../src/types.js";

const config: NearAIConfig = {
  apiKey: "fictional-test-key",
  baseURL: NEAR_AI_BASE_URL,
  model: DEFAULT_NEAR_AI_MODEL,
};
const fixture = (name: string): string => readFileSync(`fixtures/${name}`, "utf8");
const makeResponse = (updates: Record<string, unknown> = {}): string => JSON.stringify({
  recipient: "merchant.testnet",
  amount: "1.50",
  currency: "NEAR",
  invoiceReference: "INV-2026-0001",
  supplierName: "Northstar Test Services",
  validationErrors: [],
  ...updates,
});
const complete = (content: string): InferenceTransport => async () => ({ content, finishReason: "stop" });

async function expectRejected(
  input: string,
  content: string,
  field: string,
  code: string,
): Promise<void> {
  await assert.rejects(
    extractInvoiceProposal(input, { config, transport: complete(content) }),
    (err: unknown) => err instanceof InvoiceValidationError &&
      err.errors.some((e) => e.field === field && e.code === code),
  );
}

test("valid labelled invoice produces a grounded proposal, including optional supplier metadata", async () => {
  const proposal = await extractInvoiceProposal(fixture("valid-invoice.txt"), {
    config,
    transport: complete(makeResponse()),
  });
  assert.deepEqual(proposal, {
    recipient: "merchant.testnet",
    amountYoctoNear: "1500000000000000000000000",
    invoiceReference: "INV-2026-0001",
    supplierName: "Northstar Test Services",
    validationErrors: [],
  });
});

test("malicious fixture stays in user content; mocked model recipient substitution is rejected", async () => {
  const text = fixture("malicious-invoice.txt");
  const messages = buildMessages(text);
  assert.equal(messages[0]?.role, "system");
  assert.equal(messages[0]?.content, SYSTEM_PROMPT);
  assert.equal(messages[1]?.role, "user");
  assert.equal(messages[1]?.content, text);

  // Captured mock model output, deliberately poisoned to substitute the payee.
  const modelReturned = makeResponse({
    recipient: "attacker.testnet",
    invoiceReference: "INV-2026-ATTACK-01",
  });
  let observedResponse = "";
  const fakeTransport: InferenceTransport = async (sent, suppliedConfig) => {
    assert.deepEqual(sent, messages);
    assert.equal(suppliedConfig.apiKey, config.apiKey);
    observedResponse = modelReturned;
    return { content: modelReturned, finishReason: "stop" };
  };
  await assert.rejects(
    extractInvoiceProposal(text, { config, transport: fakeTransport }),
    (err: unknown) => err instanceof InvoiceValidationError &&
      err.errors.some((e) => e.field === "recipient" && e.code === "conflicting"),
  );
  assert.equal(JSON.parse(observedResponse).recipient, "attacker.testnet");
  // This is a deterministic mock, not evidence that a real model always resists injection.
});

test("correct model extraction from malicious document can be validated without following the injected instructions", async () => {
  const text = fixture("malicious-invoice.txt");
  const proposal = await extractInvoiceProposal(text, {
    config,
    transport: complete(makeResponse({ invoiceReference: "INV-2026-ATTACK-01" })),
  });
  assert.equal(proposal.recipient, "merchant.testnet");
  assert.equal(proposal.invoiceReference, "INV-2026-ATTACK-01");
  assert.equal("owner_id" in proposal, false);
  assert.equal("allowedMethods" in proposal, false);
});

test("duplicate/conflicting payees and amounts are rejected before remote inference", async () => {
  let called = false;
  const transport: InferenceTransport = async () => {
    called = true;
    return { content: makeResponse(), finishReason: "stop" };
  };
  for (const name of ["ambiguous-invoice.txt", "conflicting-amount-invoice.txt"]) {
    await assert.rejects(
      extractInvoiceProposal(fixture(name), { config, transport }),
      (err: unknown) => err instanceof InvoiceValidationError &&
        err.errors.some((e) => e.code === "conflicting"),
    );
  }
  assert.equal(called, false);
});

test("unsupported currency, missing fields, malformed recipient and invalid decimal fail closed", () => {
  const valid = fixture("valid-invoice.txt");
  assert.throws(() => parseLabelledInvoice(fixture("unsupported-currency-invoice.txt")),
    (err: unknown) => err instanceof InvoiceValidationError && err.errors[0]?.code === "unsupported_currency");
  const invalid = [
    [valid.replace("Payee NEAR account: merchant.testnet", ""), "recipient", "missing"],
    [valid.replace("merchant.testnet", "NOT AN ACCOUNT"), "recipient", "invalid"],
    [valid.replace("1.50 NEAR", "0 NEAR"), "amount", "invalid"],
    [valid.replace("1.50 NEAR", "1.0000000000000000000000001 NEAR"), "amount", "invalid"],
    [valid.replace("Invoice ref: INV-2026-0001", ""), "invoiceReference", "missing"],
    [valid + "\nPayee NEAR account: merchant.testnet", "recipient", "ambiguous"],
  ] as const;
  for (const [document, field, code] of invalid) {
    assert.throws(() => parseLabelledInvoice(document), (err: unknown) =>
      err instanceof InvoiceValidationError && err.errors[0]?.field === field && err.errors[0]?.code === code);
  }
});

test("model recipient, amount, invoice reference and supplier must be grounded in source", async () => {
  const document = fixture("valid-invoice.txt");
  await expectRejected(document, makeResponse({ recipient: "attacker.testnet" }), "recipient", "conflicting");
  await expectRejected(document, makeResponse({ amount: "1.51" }), "amount", "conflicting");
  await expectRejected(document, makeResponse({ invoiceReference: "ANOTHER-INVOICE" }), "invoiceReference", "conflicting");
  await expectRejected(document, makeResponse({ supplierName: "Imaginary Company" }), "document", "conflicting");
});

test("model output containing policy or key-scope fields is rejected as unknown", async () => {
  await assert.rejects(
    extractInvoiceProposal(fixture("valid-invoice.txt"), {
      config,
      transport: complete(makeResponse({ owner_id: "attacker.testnet", allowedMethods: ["set_limits"] })),
    }),
    InvoiceValidationError,
  );
});

test("source supplier is optional, but a model cannot invent supplier metadata", async () => {
  const document = [
    "Invoice ref: INV-2026-0001",
    "Payee NEAR account: merchant.testnet",
    "Amount payable: 1.50 NEAR",
  ].join("\n");
  await expectRejected(document, makeResponse(), "document", "conflicting");
  const proposal = await extractInvoiceProposal(document, {
    config,
    transport: complete(makeResponse({ supplierName: null })),
  });
  assert.equal(proposal.supplierName, undefined);
});

test("model-reported ambiguity causes rejection even when source labels are well formed", async () => {
  await assert.rejects(
    extractInvoiceProposal(fixture("valid-invoice.txt"), {
      config,
      transport: complete(makeResponse({
        validationErrors: [{ field: "amount", code: "ambiguous", message: "Conflicting totals" }],
      })),
    }),
    (err: unknown) => err instanceof InvoiceValidationError && err.errors[0]?.code === "ambiguous",
  );
});
