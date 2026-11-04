# Nocturne AI Agent Utilisation Guide

> **Status:** Invoice-extraction MVP, Issue [#8](https://github.com/El-swaggerito/Nocturne/issues/8).  
> **Scope:** Text invoices, NEAR AI Cloud inference and strict, local validation. **No payments are initiated.**

## 1. Purpose

The Nocturne AI agent reads **plain-text invoice content** and asks a model hosted on NEAR AI Cloud to propose payment details. Local TypeScript code then validates that proposal and converts a NEAR-denominated amount into an exact integer number of yoctoNEAR.

A successful result is **untrusted, structured invoice data**, **not** payment approval or an instruction to transfer funds. Payment controls, agent permissions and transaction execution are separate workstreams.

### Processing flow

```text
Plain-text invoice (untrusted)
          |
          v
NEAR AI Cloud Chat Completions (model extracts fields)
          |
          v
JSON parsing + strict Zod schema validation
          |
          v
NEAR account / currency / amount checks
          |
          v
Exact decimal NEAR -> integer yoctoNEAR conversion
          |
          v
Validated InvoiceProposal  OR  explicit rejection

                 No payment is made.
```

## 2. Requirements and implementation

| Component | Current implementation |
| --- | --- |
| Runtime | Node.js **22.16.0 or newer** |
| Language | TypeScript **5.8.3** |
| AI provider | **NEAR AI Cloud** |
| API | OpenAI-compatible Chat Completions, `https://cloud-api.near.ai/v1` |
| Default model | `deepseek/deepseek-v3.2` |
| Client SDK | `openai` **7.15.0** |
| Validation library | `zod` **4.6.5** |
| Supported input | Local **UTF-8 text** files, not images or PDFs |
| Supported invoice currency | **NEAR** only |

Versions reflect the dependencies and configuration in the Issue #8 implementation. To consider other hosted models, verify their current availability and JSON-response compatibility before changing `NEAR_AI_MODEL`.

## 3. Install and configure

From the **repository root**:

```bash
cd agent
npm install
```

Create a local environment file at the **repository root**, not inside `agent/`:

```bash
cd ..
cp .env.example .env
```

Edit `.env` locally:

```dotenv
NEAR_AI_KEY=your-near-ai-cloud-api-key
NEAR_AI_MODEL=deepseek/deepseek-v3.2
```

- Obtain `NEAR_AI_KEY` through your NEAR AI Cloud account. It is an **inference API key**, not a blockchain wallet key.
- `NEAR_AI_MODEL` is optional. The code defaults to `deepseek/deepseek-v3.2`.
- The API base URL is **fixed in `agent/src/config.ts`**; the implementation intentionally ignores environment-based base-URL overrides.
- Do **not** commit `.env`, API keys, wallet private keys, paid customer invoices or other sensitive information. The repository's `.gitignore` excludes `.env`.
- **Do not share your actual `.env` file** in pull requests, support requests or screenshots.

## 4. Run the agent

### 4.1 Check the installation

From `agent/`:

```bash
npm run typecheck
npm test
```

`typecheck` checks TypeScript without generating output. `test` builds the package and runs the unit tests without calling NEAR AI Cloud. Tests do not need credentials.

### 4.2 Live smoke test using the fictional fixture

```bash
cd agent  # only if you are not already in this directory
npm run smoke
```

The smoke command builds the agent and reads:

```text
agent/fixtures/valid-invoice.txt
```

It then makes a live inference request using the root `.env` file and attempts to validate the result. Live inference may incur provider charges.

**Example of successful output** (actual inference results can vary):

```json
{
  "status": "validated",
  "proposal": {
    "recipient": "merchant.testnet",
    "amountYoctoNear": "1500000000000000000000000",
    "invoiceReference": "INV-2026-0001",
    "validationErrors": []
  }
}
```

The CLI also prints:

```text
No payment was initiated.
```

The example amount is **1.50 NEAR**: one NEAR equals `10^24` yoctoNEAR. Amount conversion uses `BigInt`, not floating-point multiplication.

### 4.3 Run a different **public, non-sensitive** text fixture

From `agent/`:

```bash
npm run build
node --env-file-if-exists=../.env dist/src/cli.js fixtures/valid-invoice.txt
```

Replace the final file path with the path to your own local **plain-text** test fixture. The demonstration CLI prints validated proposal values to standard output, so **do not run it with confidential invoices**. It does not parse PDF or image files.

### 4.4 Run without a configured key

If the key is unset or still contains the example placeholder, a live run fails with a clear configuration message rather than exposing a credential. The unit tests explicitly cover missing-key behaviour.

## 5. Input and output contract

### 5.1 Illustrative invoice input

```text
SAMPLE INVOICE (fictional data only)
Invoice ref: INV-2026-0001
Supplier: Northstar Test Services
Payee NEAR account: merchant.testnet
Amount payable: 1.50 NEAR
Purpose: Development services
```

The model is instructed to return **only** this intermediate JSON structure, with no extra fields:

```json
{
  "recipient": "merchant.testnet",
  "amount": "1.50",
  "currency": "NEAR",
  "invoiceReference": "INV-2026-0001",
  "validationErrors": []
}
```

The intermediate response is **not trusted** simply because the model generated it. `agent/src/types.ts` checks it before producing an `InvoiceProposal`.

### 5.2 Validated `InvoiceProposal`

| Field | Type | Meaning |
| --- | --- | --- |
| `recipient` | string | NEAR account identifier passing the local format check |
| `amountYoctoNear` | string | Positive, base-10 integer yoctoNEAR amount, within the NEAR `u128` bound |
| `invoiceReference` | string | Non-empty invoice reference, up to 128 characters |
| `validationErrors` | empty tuple | Must be empty for a successfully validated proposal |

The schema rejects missing fields, unknown fields, invalid account-ID formats, zero amounts and amounts that cannot be represented exactly with up to 24 decimal places. Non-NEAR currencies are unsupported in the MVP.

**Critical limitation:** Passing validation proves the **shape and local constraints** of the proposal, not the authenticity of the invoice, the legitimacy of the recipient or the factual accuracy of the extraction.

## 6. Failure handling and diagnostics

A rejected invoice generates **no validated proposal**. For example:

```text
Invoice rejected during validation; no payment proposal was generated.
- document: invalid
```

Common rejection reasons:

| Condition | Expected outcome |
| --- | --- |
| Missing `NEAR_AI_KEY` | Configuration error with no key value logged |
| Malformed JSON or Markdown code fences | `document: invalid` |
| Unknown JSON properties (including nested fields) | Strict schema rejection |
| Missing or invalid recipient | Validation rejection |
| Unsupported currency | `currency: unsupported_currency` |
| Missing, ambiguous or contradictory details reported by model | Validation rejection |
| Invalid or inexact decimal NEAR amount | Validation rejection |
| Input empty or longer than 16,000 characters | Input error before inference |
| Completion empty, interrupted or truncated | Inference error |
| Provider call fails | Sanitised inference error without raw SDK response |

The current implementation may print local messages such as `Diagnostic: Model response is not valid JSON.` or `Schema diagnostics: [...]` during negative tests. These are **development diagnostics**, not evidence of a passing extraction. Review or remove temporary diagnostics before deploying a production service; never log raw invoice content, raw provider responses or credentials.

If a model repeatedly returns `document: invalid`, check JSON-mode support for that model and its ability to match the required keys. **Do not loosen the schema** just to make an invalid response pass.

## 7. Programmatic use in TypeScript

The package exports an inference function and validation errors through source modules. In server-side code that already loads its environment variables:

```typescript
import { extractInvoiceProposal } from "./src/inference.js";
import { InvoiceValidationError } from "./src/types.js";

const invoiceText = [
  "Invoice ref: INV-2026-0001",
  "Payee NEAR account: merchant.testnet",
  "Amount payable: 1.50 NEAR",
].join("\n");

try {
  const proposal = await extractInvoiceProposal(invoiceText);
  // Treat proposal as untrusted candidate data.
  // Do not sign, broadcast or authorise payment here.
  console.log("Invoice proposal validated");
} catch (error) {
  if (error instanceof InvoiceValidationError) {
    // Surface only approved error codes and field names.
    console.error(error.errors.map(({ field, code }) => ({ field, code })));
  } else {
    console.error("Invoice could not be processed");
  }
}
```

This example assumes server-side execution and a configured `NEAR_AI_KEY`. It does **not** supply an HTTP endpoint or payment integration.

### Internal source file map

| File | Responsibility |
| --- | --- |
| `src/config.ts` | API key, fixed provider URL and model selection |
| `src/inference.ts` | Prompt construction, NEAR AI Cloud request and response handling |
| `src/types.ts` | Zod schemas, validation errors and exact yoctoNEAR conversion |
| `src/cli.ts` | Local text-fixture runner |
| `tests/config.test.ts` | Configuration and missing-key tests |
| `tests/inference.test.ts` | Prompt boundaries, transport and completion tests |
| `tests/types.test.ts` | Strict schema and amount tests |

## 8. Security boundaries

1. **Invoice content is data.** Never insert it into a system instruction, developer instruction or access-key permission list. The existing `buildMessages()` sends invoice text in a user message.
2. **Model output is untrusted.** Validate it locally, reject unknown fields and do not interpret its prose as authority.
3. **No private wallet keys belong in this agent's inference configuration.** The cloud inference key is distinct from a NEAR signing key.
4. **No payment authorisation is implied.** An `InvoiceProposal` must undergo independent checks before any later payment workflow.
5. **Injection remains a risk.** A well-formed, maliciously altered recipient or amount can still pass purely structural validation. Verify the proposed values against an authenticated source and enforce payment policy on-chain.
6. **Avoid sensitive invoice disclosure.** The sample CLI outputs proposal details and sends invoice text to an external inference service. Do not use private invoices with this demo workflow without a separately reviewed data-handling design.

Security documentation and least-privilege NEAR access-key design are covered by [Issue #2](https://github.com/El-swaggerito/Nocturne/issues/2) and [Issue #4](https://github.com/El-swaggerito/Nocturne/issues/4). Full adversarial invoice extraction and checks are addressed in [Issue #9](https://github.com/El-swaggerito/Nocturne/issues/9).

## 9. What is and is not ready

**Working locally (reported 4 November 2026):**

- Successful live smoke test with the fictional invoice.
- Successful TypeScript typecheck.
- All **12** local unit tests passing, including malformed JSON, unknown fields, prompt-injection boundaries and exact amount conversion.

**Not yet implemented or established:**

- PDF/image invoice ingestion.
- Independent proof that extracted values match the source invoice.
- Production-grade adversarial evaluation and live monitoring.
- Automatic payments, wallet signing or on-chain payment authorisation.
- Production security review and deployment readiness.

These are separate from successfully completing the initial inference-and-schema milestone.

## 10. Contribution workflow

Work from the latest team repository `main` and open focused pull requests from a feature branch. For the initial agent implementation:

```bash
git status
git add AGENT_UTILISATION.md
git commit -m "docs(ai): add agent utilisation guide"
git push
```

If you place this guide under `agent/`, adjust the path in `git add` accordingly. Check staged changes with `git diff --cached` and ensure `.env`, credentials and private invoices are not included. Request another team member's review, including Joe for changes affecting security boundaries.

---

**Related documents:** [Agent README](https://github.com/Lakes41/Nocturne/blob/feat/8-near-ai-invoice-schema/agent/README.md) · [Issue #8](https://github.com/El-swaggerito/Nocturne/issues/8) · [Issue #9](https://github.com/El-swaggerito/Nocturne/issues/9)
