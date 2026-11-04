import { z } from "zod";

const MAX_YOCTO_NEAR = (1n << 128n) - 1n;
const YOCTO_PER_NEAR = 10n ** 24n;

export const validationErrorSchema = z.strictObject({
  field: z.enum(["recipient", "amount", "currency", "invoiceReference", "document"]),
  code: z.enum(["missing", "ambiguous", "invalid", "conflicting", "unsupported_currency"]),
  message: z.string().min(1).max(160),
});

export type ValidationError = z.infer<typeof validationErrorSchema>;

/**
 * Strict contract for model output. A missing/unclear field is null and must
 * have a corresponding validation error. A model must not supply yoctoNEAR.
 * We calculate that ourselves from the raw decimal amount string.
 */
export const modelInvoiceSchema = z.strictObject({
  recipient: z.string().nullable(),
  amount: z.string().nullable(),
  currency: z.string().nullable(),
  invoiceReference: z.string().nullable(),
  validationErrors: z.array(validationErrorSchema).max(12),
});

export type ModelInvoice = z.infer<typeof modelInvoiceSchema>;

const nearAccountIdSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "Invalid NEAR account ID");

export const invoiceProposalSchema = z.strictObject({
  recipient: nearAccountIdSchema,
  amountYoctoNear: z
    .string()
    .regex(/^[1-9][0-9]*$/, "Must be a positive integer decimal string")
    .refine((value) => BigInt(value) <= MAX_YOCTO_NEAR, "Exceeds NEAR u128 limit"),
  invoiceReference: z.string().trim().min(1).max(128),
  validationErrors: z.tuple([]),
});

/** This is data only; never treat a proposal as authorisation to transfer. */
export type InvoiceProposal = z.infer<typeof invoiceProposalSchema>;

export class InvoiceValidationError extends Error {
  readonly errors: readonly ValidationError[];

  constructor(errors: readonly ValidationError[]) {
    super("Invoice rejected during validation; no payment proposal was generated.");
    this.name = "InvoiceValidationError";
    this.errors = errors;
  }
}

function invalid(field: ValidationError["field"], message: string): InvoiceValidationError {
  return new InvoiceValidationError([{ field, code: "invalid", message }]);
}

/** Convert a canonical decimal NEAR string to integer yoctoNEAR with BigInt. */
export function nearToYoctoNear(amount: string): string {
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,24})?$/.test(amount)) {
    throw invalid("amount", "NEAR amount must be a non-negative decimal with at most 24 places.");
  }

  const [whole, fraction = ""] = amount.split(".");
  const yocto = BigInt(whole!) * YOCTO_PER_NEAR + BigInt(fraction.padEnd(24, "0") || "0");
  if (yocto <= 0n || yocto > MAX_YOCTO_NEAR) {
    throw invalid("amount", "NEAR amount must be positive and fit within u128.");
  }
  return yocto.toString();
}

function requireText(field: ValidationError["field"], value: string | null): string {
  if (value === null || !value.trim()) {
    throw new InvoiceValidationError([{ field, code: "missing", message: `Invoice ${field} is missing.` }]);
  }
  return value;
}

/**
 * Turn an untrusted chat completion into either a validated proposal or a
 * typed explicit error. Unknown keys are always rejected, including nested.
 */
export function parseInvoiceProposal(responseText: string): InvoiceProposal {
  let raw: unknown;
  try {
    raw = JSON.parse(responseText);
  } catch {
    console.error("Diagnostic: Model response is not valid JSON.");
    throw invalid("document", "Model output was not a JSON object.");
  }

  const checked = modelInvoiceSchema.safeParse(raw);

  if (!checked.success) {
    const allowed = [
      "recipient",
      "amount",
      "currency",
      "invoiceReference",
      "validationErrors",
      ];

    console.error(
      "Schema diagnostics:",
      checked.error.issues.map((issue) => ({
        field: allowed.includes(String(issue.path[0]))
          ? String(issue.path[0])
          : "document",
        code: issue.code,
      })),
    );
    // Never expose model-supplied values in errors or logs.
    throw invalid(
      "document",
      "Model output did not match the strict invoice schema.",
    );
  }

  const input = checked.data;
  if (input.validationErrors.length > 0) {
    throw new InvoiceValidationError(input.validationErrors);
  }
  const recipient = requireText("recipient", input.recipient);
  const amount = requireText("amount", input.amount);
  const currency = requireText("currency", input.currency);
  const invoiceReference = requireText("invoiceReference", input.invoiceReference);

  if (currency !== "NEAR") {
    throw new InvoiceValidationError([
      { field: "currency", code: "unsupported_currency", message: "Only NEAR invoices are supported." },
    ]);
  }

  const proposal = invoiceProposalSchema.safeParse({
    recipient,
    amountYoctoNear: nearToYoctoNear(amount),
    invoiceReference,
    validationErrors: [],
  });
  if (!proposal.success) {
    throw invalid("document", "Invoice fields did not meet proposal constraints.");
  }
  return proposal.data;
}
