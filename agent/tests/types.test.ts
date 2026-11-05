import test from "node:test";
import assert from "node:assert/strict";
import { InvoiceValidationError, nearToYoctoNear, parseInvoiceProposal } from "../src/types.js";

const base = {
  recipient: "merchant.testnet",
  amount: "1.50",
  currency: "NEAR",
  invoiceReference: "INV-2026-0001",
  validationErrors: [],
};

test("valid model JSON produces a strongly validated yoctoNEAR proposal", () => {
  assert.deepEqual(parseInvoiceProposal(JSON.stringify(base)), {
    recipient: "merchant.testnet",
    amountYoctoNear: "1500000000000000000000000",
    invoiceReference: "INV-2026-0001",
    validationErrors: [],
  });
});

test("invalid JSON and markdown code fences are rejected", () => {
  assert.throws(() => parseInvoiceProposal("not JSON"), InvoiceValidationError);
  assert.throws(() => parseInvoiceProposal("```json\n{}\n```"), InvoiceValidationError);
});

test("unknown fields at any level are rejected", () => {
  assert.throws(() => parseInvoiceProposal(JSON.stringify({ ...base, approved: true })), InvoiceValidationError);
  assert.throws(
    () => parseInvoiceProposal(JSON.stringify({ ...base, validationErrors: [{ field: "amount", code: "invalid", message: "Bad", pay: true }] })),
    InvoiceValidationError,
  );
});

test("untrusted model validation errors result in no proposal", () => {
  assert.throws(
    () => parseInvoiceProposal(JSON.stringify({ ...base, validationErrors: [{ field: "recipient", code: "ambiguous", message: "Two recipients" }] })),
    (error: unknown) => error instanceof InvoiceValidationError && error.errors[0]?.code === "ambiguous",
  );
});

test("unsupported currency, absent fields and invalid recipients are rejected", () => {
  for (const bad of [
    { ...base, currency: "USD" },
    { ...base, recipient: null },
    { ...base, recipient: "Not A NEAR Account" },
    { ...base, invoiceReference: "" },
    { ...base, amount: 1.5 },
  ]) {
    assert.throws(() => parseInvoiceProposal(JSON.stringify(bad)), InvoiceValidationError);
  }
});

test("BigInt conversion is exact and refuses inexact or unsafe decimal formats", () => {
  assert.equal(nearToYoctoNear("0.000000000000000000000001"), "1");
  assert.equal(nearToYoctoNear("1"), "1000000000000000000000000");
  for (const bad of ["0", "0.0", "-1", "1e4", "01", "1.0000000000000000000000001", "", "1,500", "999999999999999999999999999999999999999999"]) {
    assert.throws(() => nearToYoctoNear(bad), InvoiceValidationError);
  }
});
