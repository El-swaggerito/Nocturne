import { invoiceProposalSchema, InvoiceValidationError, nearToYoctoNear, type InvoiceProposal, type ValidationError } from "./types.js";
import type { LabelledInvoice } from "./invoice.js";

/**
 * A syntactically valid model response is not necessarily faithful to its source.
 * Fail closed when any payment-critical model field differs from the explicitly
 * labelled source invoice. This is not a policy or recipient-allowlist check.
 */
export function validateInvoiceAgainstSource(
  source: LabelledInvoice,
  proposal: InvoiceProposal,
): InvoiceProposal {
  const failures: ValidationError[] = [];
  const conflict = (field: ValidationError["field"]): void => {
    failures.push({ field, code: "conflicting", message: `Extracted ${field} does not match the invoice.` });
  };

  if (proposal.recipient !== source.recipient) conflict("recipient");
  if (proposal.amountYoctoNear !== nearToYoctoNear(source.amount)) conflict("amount");
  if (proposal.invoiceReference !== source.invoiceReference) conflict("invoiceReference");
  if (proposal.supplierName !== undefined && proposal.supplierName !== source.supplierName) {
    conflict("document");
  }

  if (failures.length) throw new InvoiceValidationError(failures);

  // Supplier is optional metadata, sourced from a labelled field, and never
  // forwarded wholesale to the contract as part of a payment transaction.
  const grounded = {
    ...proposal,
    ...(source.supplierName === undefined ? {} : { supplierName: source.supplierName }),
  };
  return invoiceProposalSchema.parse(grounded);
}
