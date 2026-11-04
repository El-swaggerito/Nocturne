import { InvoiceValidationError, nearAccountIdSchema, nearToYoctoNear, type ValidationError } from "./types.js";

/**
 * Explicitly labelled text invoices are the only accepted document format in the MVP.
 * Unlabelled notes (including possible prompt injections) are never payment fields.
 * This parser is not a general PDF, OCR or free-form invoice parser.
 */
export interface LabelledInvoice {
  readonly recipient: string;
  readonly amount: string;
  readonly currency: "NEAR";
  readonly invoiceReference: string;
  readonly supplierName?: string;
}

type Label = "recipient" | "amount" | "invoiceReference" | "supplierName";

const LABELS: ReadonlyArray<{ field: Label; pattern: RegExp }> = [
  { field: "recipient", pattern: /^(?:payee|recipient)\s+NEAR\s+account\s*:\s*(.*)$/i },
  { field: "amount", pattern: /^amount\s+payable\s*:\s*(.*)$/i },
  { field: "invoiceReference", pattern: /^invoice\s+(?:ref(?:erence)?|number|no\.?)\s*:\s*(.*)$/i },
  { field: "supplierName", pattern: /^supplier\s*:\s*(.*)$/i },
];

function failure(field: ValidationError["field"], code: ValidationError["code"]): never {
  throw new InvoiceValidationError([{ field, code, message: `Invoice ${field} is ${code}.` }]);
}

function uniqueField(values: readonly string[], field: ValidationError["field"], optional = false): string | undefined {
  if (values.length === 0) {
    if (optional) return undefined;
    return failure(field, "missing");
  }
  if (values.length > 1) {
    return failure(field, new Set(values).size > 1 ? "conflicting" : "ambiguous");
  }
  const value = values[0]?.trim();
  if (!value) return failure(field, "missing");
  return value;
}

/**
 * Parse only explicit payment labels. Duplicate labels always fail closed,
 * even if repeated values appear identical. A malicious note containing an
 * additional 'Payee NEAR account:' line is therefore not silently preferred.
 */
export function parseLabelledInvoice(invoiceText: string): LabelledInvoice {
  const found: Record<Label, string[]> = {
    recipient: [], amount: [], invoiceReference: [], supplierName: [],
  };

  for (const rawLine of invoiceText.split(/\r?\n/)) {
    const line = rawLine.trim();
    for (const { field, pattern } of LABELS) {
      const match = pattern.exec(line);
      if (match) {
        found[field].push(match[1]?.trim() ?? "");
        break;
      }
    }
  }

  const recipient = uniqueField(found.recipient, "recipient")!;
  const amountWithCurrency = uniqueField(found.amount, "amount")!;
  const invoiceReference = uniqueField(found.invoiceReference, "invoiceReference")!;
  const supplierName = uniqueField(found.supplierName, "document", true);

  if (!nearAccountIdSchema.safeParse(recipient).success) failure("recipient", "invalid");
  if (invoiceReference.length > 128) failure("invoiceReference", "invalid");
  if (supplierName !== undefined && supplierName.length > 128) failure("document", "invalid");

  const amountMatch = /^(\S+)\s+([A-Za-z]{2,12})$/.exec(amountWithCurrency);
  if (!amountMatch) failure("amount", "invalid");
  const [, amount, currency] = amountMatch!;
  if (currency !== "NEAR") failure("currency", "unsupported_currency");
  // No floating point. Exact decimal parsing also rejects zero, negative,
  // scientific notation, excessive precision and u128 overflow.
  nearToYoctoNear(amount!);

  return {
    recipient,
    amount: amount!,
    currency: "NEAR",
    invoiceReference,
    ...(supplierName === undefined ? {} : { supplierName }),
  };
}
