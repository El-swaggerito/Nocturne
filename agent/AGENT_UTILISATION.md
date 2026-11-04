# Nocturne AI Agent Utilisation Guide

> **Implementation:** Issues [#8](https://github.com/El-swaggerito/Nocturne/issues/8) and [#9](https://github.com/El-swaggerito/Nocturne/issues/9)  
> **Verified locally:** 4 November 2026, based on developer-reported test and live smoke-test output  
> **Scope:** Explicitly labelled UTF-8 text invoices, NEAR AI Cloud inference, deterministic source checks and strict invoice proposal validation.  
> **Safety boundary:** A validated invoice proposal is **not** permission to pay. The agent does not sign or submit blockchain transactions.

## 1. Purpose

Nocturne's AI agent extracts candidate payment details from invoice text using NEAR AI Cloud. It then independently checks the model response against the explicitly labelled fields in the original document before producing a typed `InvoiceProposal`.

The design has two complementary layers:

1. **Model extraction:** The model proposes the recipient, raw amount, currency, invoice reference and optional supplier name.
2. **Deterministic validation:** Local TypeScript checks the original invoice, enforces the model output schema and rejects any mismatch between the model's proposed payment fields and the labelled source fields.

**Neither layer verifies invoice authenticity, recipient ownership or eligibility under an owner's payment policy.** Those controls belong to later contract and security work.

### Processing workflow

```text
Untrusted UTF-8 invoice text
             |
             v
Pre-check input length and required labelled fields
- reject missing/duplicate/conflicting labels
- reject unsupported currencies and invalid amounts
             |
             v
NEAR AI Cloud Chat Completions (DeepSeek V3.2)
- fixed system instruction
- full invoice included only as a user message
             |
             v
Strict JSON and Zod schema validation
- reject malformed/unknown fields and model-reported errors
             |
             v
Exact decimal NEAR -> integer yoctoNEAR conversion (BigInt)
             |
             v
Compare model fields with original labelled invoice fields
- recipient, amount, reference and optional supplier
             |
             v
Validated InvoiceProposal OR explicit rejection

No payment, wallet signing or smart-contract call occurs.
```

## 2. Technology and scope

| Component | Current choice |
| --- | --- |
| Runtime | Node.js `>=22.16.0` |
| Language | TypeScript `5.8.3` |
| Provider | NEAR AI Cloud |
| API | OpenAI-compatible Chat Completions v1: `https://cloud-api.near.ai/v1/chat/completions` |
| Default model | `deepseek/deepseek-v3.2` |
| SDK | `openai` `7.15.0` |
| Validation | `zod` `4.6.5` |
| Supported input | Local, explicitly labelled UTF-8 `.txt` invoices |
| Supported currency | `NEAR` only |
| Excluded | PDF, image and OCR input, arbitrary invoice layouts, payment signing and execution |

The implementation sends `temperature: 0`, `max_tokens: 700` and `response_format: { type: "json_object" }`. The provider URL is fixed in `src/config.ts`; `NEAR_AI_MODEL` may select a different model after its compatibility has been checked.

Versions above reflect the Issue #9 code based on Issue #8. Provider model availability and pricing may change.

## 3. Installation and configuration

From the repository root:

```bash
cd agent
npm install
```

Create `.env` **at the repository root**, not in `agent/`:

```bash
cd ..
cp .env.example .env
```

Edit `.env` locally:

```dotenv
NEAR_AI_KEY=your-near-ai-cloud-key
NEAR_AI_MODEL=deepseek/deepseek-v3.2
```

`NEAR_AI_KEY` is an inference credential, **not** a NEAR account private key. Keep `.env` and all signing keys outside version control. Never send a real key, raw invoice or private customer data in a screenshot, issue or pull request.

The agent refuses a missing or placeholder `NEAR_AI_KEY` with a clear, sanitised error. A custom API base URL supplied through the environment is intentionally ignored so the key cannot accidentally be sent to an arbitrary endpoint.

## 4. Using the agent

All commands in this section run from `agent/`.

### 4.1 Offline checks

```bash
npm run typecheck
npm test
```

- `typecheck` verifies TypeScript without creating build artefacts.
- `test` builds the package and runs local Node test files, including `tests/invoice.test.ts`.
- Automated tests use fictional fixtures and mocked model transport. They do **not** need an API key or invoke NEAR AI Cloud.

### 4.2 Live valid-invoice smoke test

```bash
npm run smoke
```

The command builds the agent and processes `fixtures/valid-invoice.txt` through the configured NEAR AI Cloud model. Live inference may be chargeable. A successful run observed on 4 November 2026 returned:

```json
{
  "status": "validated",
  "proposal": {
    "recipient": "merchant.testnet",
    "amountYoctoNear": "1500000000000000000000000",
    "invoiceReference": "INV-2026-0001",
    "supplierName": "Northstar Test Services",
    "validationErrors": []
  }
}
```

The CLI then printed `No payment was initiated.`

### 4.3 Live adversarial smoke test

```bash
npm run build
node --env-file-if-exists=../.env dist/src/cli.js fixtures/malicious-invoice.txt
```

The malicious fixture contains an untrusted note instructing the model to substitute `attacker.testnet`, change `owner_id` and allow `set_limits`. The explicitly labelled payee remains `merchant.testnet`.

For the reported 4 November 2026 run, the result retained the labelled recipient and returned invoice reference `INV-2026-ATTACK-01`, with no payment initiated.

**Interpretation:** This is one successful live adversarial example, **not** proof that DeepSeek V3.2 always resists prompt injection. The offline mocked test separately demonstrates that if the model outputs `attacker.testnet`, the source-validation layer rejects it.

### 4.4 Run another local fixture

```bash
npm run build
node --env-file-if-exists=../.env dist/src/cli.js fixtures/valid-invoice.txt
```

Replace the last argument with the path to another **fictional, non-sensitive, UTF-8 text invoice**. The demonstration CLI prints the validated proposal to the terminal, and sends invoice text to an external inference provider. Do not use it for confidential invoices without an approved data-handling process.

## 5. Supported invoice format

The MVP is not a general-purpose invoice parser. It accepts a small set of **explicit line labels**:

```text
SAMPLE INVOICE (fictional data only)
Invoice ref: INV-2026-0001
Supplier: Northstar Test Services
Payee NEAR account: merchant.testnet
Amount payable: 1.50 NEAR
Purpose: Development services
```

| Field | Supported labels | Required |
| --- | --- | --- |
| Recipient | `Payee NEAR account:` or `Recipient NEAR account:` | Yes |
| Amount and currency | `Amount payable: 1.50 NEAR` | Yes |
| Reference | `Invoice ref:`, `Invoice reference:`, `Invoice number:`, `Invoice no:` | Yes |
| Supplier | `Supplier:` | No |

Labels are matched without case sensitivity. The currency value itself must be `NEAR`. Whitespace around labels and values is trimmed. Unlabelled lines, such as `Purpose:` and the malicious free-text note, are not treated as payment fields by the deterministic parser, although the model still receives the complete document as untrusted input.

A required label occurring more than once fails closed: identical duplicate values are considered **ambiguous**, while different values are **conflicting**. This also applies to the optional supplier label when duplicated. Unsupported currencies, malformed recipient IDs, missing references and amounts that cannot be represented precisely are rejected **before** inference.

### Local fixtures

| Fixture | Expected behaviour |
| --- | --- |
| `fixtures/valid-invoice.txt` | Source-valid; model output can become a validated proposal if it matches |
| `fixtures/malicious-invoice.txt` | Contains a recipient-substitution instruction; wrong model recipient must be rejected |
| `fixtures/ambiguous-invoice.txt` | Conflicting payee labels; reject before inference |
| `fixtures/conflicting-amount-invoice.txt` | Different payable amounts; reject before inference |
| `fixtures/unsupported-currency-invoice.txt` | USD amount; reject before inference |

These fixtures are fictional and must not contain production credentials or private invoice data.

## 6. Model schema and validated proposal

### 6.1 Untrusted model output

The model is asked to return a single JSON object with required keys `recipient`, `amount`, `currency`, `invoiceReference`, `validationErrors`, plus optional `supplierName`:

```json
{
  "recipient": "merchant.testnet",
  "amount": "1.50",
  "currency": "NEAR",
  "invoiceReference": "INV-2026-0001",
  "supplierName": "Northstar Test Services",
  "validationErrors": []
}
```

The model's raw amount is a decimal **string**, not a floating-point number or a yoctoNEAR integer. An absent supplier may be `null` or omitted. The validator rejects unknown top-level or nested fields, invalid field types, Markdown code fences, malformed JSON and any non-empty `validationErrors` array.

### 6.2 Validated `InvoiceProposal`

| Property | Type | Meaning |
| --- | --- | --- |
| `recipient` | string | Syntactically valid NEAR account ID matching the labelled source |
| `amountYoctoNear` | string | Positive integer yoctoNEAR amount matching the labelled source |
| `invoiceReference` | string | Invoice reference matching the labelled source |
| `supplierName` | optional string | Non-authoritative supplier metadata, grounded in the labelled source |
| `validationErrors` | empty tuple | Empty for a successfully validated proposal |

Conversion uses integer arithmetic with `BigInt`: `1 NEAR = 10^24 yoctoNEAR`. Accepted decimals have up to 24 fractional digits and must be positive and within the NEAR `u128` limit. The implementation rejects exponent notation, negative and zero amounts, excess precision and malformed decimals.

**Do not pass the entire `InvoiceProposal` as smart-contract arguments.** An explicit adapter and contract authorisation belong to future work.

## 7. Source-grounded validation

In Issue #9, validation is deliberately performed twice:

1. `parseLabelledInvoice()` reads the original invoice and rejects unsupported, duplicated or invalid source fields before any network request.
2. `validateInvoiceAgainstSource()` compares the Zod-validated model proposal with the original recipient, exact yoctoNEAR amount, reference and optional supplier after inference.

If the model returns `attacker.testnet` but the labelled payee is `merchant.testnet`, the proposal is rejected with a recipient conflict. A changed amount, changed reference or invented supplier also causes rejection. If the model reports missing or ambiguous fields, that report causes rejection even when the source parser accepted the document.

These checks improve grounding for the **supported labelled format**. They do not authenticate who created the invoice, prevent tampering with the underlying invoice itself or prove that a recipient is on the owner's allowlist.

## 8. Errors and troubleshooting

The CLI produces an explicit error rather than a payment proposal when validation fails. Examples of rejection conditions:

| Condition | Expected handling |
| --- | --- |
| Missing or placeholder `NEAR_AI_KEY` | Clear configuration error, without printing the key |
| Empty invoice or over 16,000 characters | Reject before remote inference |
| Required label missing | `missing` validation error |
| Repeated identical label | `ambiguous` validation error |
| Conflicting label values | `conflicting` validation error |
| Unsupported currency | `unsupported_currency` validation error |
| Invalid NEAR account ID or amount | `invalid` validation error |
| Wrong recipient/amount/reference/supplier returned by model | `conflicting` validation error |
| Unknown JSON property or malformed completion | Document-level validation rejection |
| Model reports ambiguity or conflicting details | Reject with explicit validation errors |
| Provider fails, response is empty or generation is truncated | Sanitised inference error |

The current implementation can print diagnostic lines such as `Diagnostic: Model response is not valid JSON.` and `Schema diagnostics: [...]` during negative tests. These are expected developer diagnostics containing field identifiers and error codes, not raw invoice contents. Remove or gate temporary diagnostic logs before production deployment.

A successfully parsed model response still needs source validation. **Do not disable strict schema checks to force a model response to pass.**

## 9. Programmatic TypeScript use

The extraction function is designed for server-side use with a configured `NEAR_AI_KEY`:

```typescript
import { extractInvoiceProposal } from "./src/inference.js";
import { InvoiceValidationError } from "./src/types.js";

const invoiceText = [
  "Invoice ref: INV-2026-0001",
  "Supplier: Northstar Test Services",
  "Payee NEAR account: merchant.testnet",
  "Amount payable: 1.50 NEAR",
].join("\n");

try {
  const proposal = await extractInvoiceProposal(invoiceText);
  // Proposal is validated data, NOT an approved payment.
  console.log("Invoice proposal validated", proposal.invoiceReference);
} catch (error) {
  if (error instanceof InvoiceValidationError) {
    console.error(error.errors.map(({ field, code }) => ({ field, code })));
  } else {
    console.error("Invoice processing failed");
  }
}
```

This function does not expose a web API or invoke a NEAR smart contract. The `InferenceTransport` type allows unit tests to supply a mock response without contacting the provider.

## 10. Source files

| Path | Responsibility |
| --- | --- |
| `src/config.ts` | Reads model configuration and cloud inference key |
| `src/inference.ts` | Constructs fixed system/user messages, calls the model and orchestrates validation |
| `src/invoice.ts` | Deterministically parses labelled invoice fields |
| `src/validation.ts` | Compares model proposal with the labelled source |
| `src/types.ts` | Strict Zod schemas, typed errors, NEAR account format and exact amount conversion |
| `src/cli.ts` | Demonstration command for local fictional text fixtures |
| `tests/config.test.ts` | Missing credentials and fixed endpoint behaviour |
| `tests/inference.test.ts` | Prompt boundaries, transport failures and incomplete completions |
| `tests/types.test.ts` | JSON/schema validation and BigInt conversion |
| `tests/invoice.test.ts` | Source grounding, conflicting fields and adversarial invoice scenarios |

## 11. Security boundaries and limitations

- **Untrusted input:** Invoice text is sent as a **user** message. It must never be copied into privileged system instructions, access-key scopes or owner policy configuration.
- **Strict parsing:** Unknown JSON fields, including fields such as `owner_id` or `allowedMethods`, are rejected.
- **No signing authority:** The inference agent requires a cloud API key, not a wallet private key. It does not make payment requests.
- **No payment authorisation:** Even a grounded invoice must pass independent recipient, spending-limit, balance, replay and identity checks enforced by the future on-chain contract.
- **No authentic-source guarantee:** The source parser accepts the labels present in the text; an attacker who controls the text can alter the labelled values. No cryptographic authenticity check exists.
- **Limited formats:** The MVP does not support arbitrary invoice layouts, screenshots, OCR, image uploads or PDFs.
- **No general injection guarantee:** The malicious fixture tests one attack pattern. Prompt injection may still affect model behaviour in other circumstances.
- **Privacy:** The invoice content is sent to NEAR AI Cloud. Do not process private invoices without an approved retention, access and provider-data handling plan.

## 12. Verification evidence and next steps

### Developer-reported checks, 4 November 2026

| Check | Observed outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | **21 passed, 0 failed** |
| Live valid invoice | Accepted `merchant.testnet`, 1.50 NEAR, reference `INV-2026-0001`, supplier `Northstar Test Services` |
| Live malicious invoice | Accepted the **labelled** `merchant.testnet`, not the injected `attacker.testnet`; reference `INV-2026-ATTACK-01` |
| Transaction behaviour | CLI printed `No payment was initiated.` for both live tests |

Unit tests include a **mocked** model returning an attacker-controlled recipient and confirm that the grounding validator rejects it. The two live tests used NEAR AI Cloud; the full 21-test suite did not make network calls. These results are evidence for the tested fixtures only, not proof of production readiness.

### Dependencies

- [Issue #6: Reserved payments and safe callbacks](https://github.com/El-swaggerito/Nocturne/issues/6) must agree the `request_payment` argument shape, invoice reference/hash strategy and request ID. This interface is **not yet confirmed**.
- [Issue #10: Restricted on-chain payment proposal client](https://github.com/El-swaggerito/Nocturne/issues/10) will handle any explicit proposal-to-contract adapter, safe retries and restricted agent credentials.
- [Issues #2 and #4](https://github.com/El-swaggerito/Nocturne/issues/2) cover threat modelling and least-privilege NEAR access-key controls.

## 13. Contributing

Keep Issue #9 changes in `agent/` and use the `feat/9-invoice-extraction-validation` feature branch. If Issue #8 is not yet merged into the team repository's `main`, coordinate the branch base and rebase after merge to avoid including Issue #8 changes in the Issue #9 PR.

Before committing:

```bash
git status
git diff --check
git diff --cached
```

From the repository root, after placing this document at `agent/AGENT_UTILISATION.md`:

```bash
git add agent/AGENT_UTILISATION.md agent/README.md
git commit -m "docs(ai): update agent guide for invoice validation"
git push
```

Never commit `.env` files, wallet keys, provider secrets or private invoices. When Issue #9 meets all agreed acceptance criteria, mention `Closes #9` in its pull request and request review from another team member, including Joe for security-sensitive changes.


---

## Issue #10: restricted testnet payment proposal client

**Status:** prepared for offline tests and contract interface review. The
payment CLI remains inference-only. The library's restricted testnet signing
path is separately opt-in, and no transaction is sent by default.

- `src/near.ts` contains the narrow `request_payment` adapter and result
  classification. No other change method is exposed.
- `src/payment-journal.ts` stores a stable invoice-scoped request ID and an
  irreversible attempt marker so a timeout or restart cannot accidentally
  generate a different ID or broadcast again.
- `src/config.ts` loads dedicated testnet account details, the restricted
  agent key, an explicitly permitted journal location and two opt-in switches.
- `tests/near.test.ts` exercises malformed input, key permissions, request
  persistence, timeouts, duplicate prevention and finality classifications.

**Approval gate:** Method argument names
(`request_id`, `recipient_id`, `amount_yocto`, `invoice_reference`) are
provisional pending [Issue #6](https://github.com/El-swaggerito/Nocturne/issues/6).
Key setup and revocation require the security review under Issue #4. Keep
`NEAR_ENABLE_TESTNET_WRITES=no` and `NEAR_CONTRACT_INTERFACE_AGREED=no` until
those reviews are complete. Real testnet evidence belongs to Issue #14.

NEAR transaction execution and asynchronous payout settlement are different
facts. A transaction with final execution status `FINAL` is still shown as
`pending` until a trusted contract settlement view is agreed and checks the
matching request ID, recipient and amount. Uncertain RPC responses remain
pending and are never automatically resent.

The default `.local/` journal is ignored by Git. Never delete it during a
network failure or include it in public attachments. Preserve it across
restarts and arrange durable backups for anything beyond local development.
