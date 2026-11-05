# Nocturne AI Agent

This TypeScript package extracts **candidate payment fields** from explicitly labelled text invoices using NEAR AI Cloud. It validates the response against strict Zod schemas and checks extracted payment details against the original invoice labels.

**Invoice extraction alone does not authorise payments.** Issue #10 adds an opt-in, server-side NEAR testnet payment client, disabled for live transactions until the security/key and contract interface reviews are complete. The existing invoice CLI never sends payments.

For the complete operating guide, see [AGENT_UTILISATION.md](./AGENT_UTILISATION.md).

## Stack

- Node.js `>=22.16.0`, TypeScript `5.8.3`
- NEAR AI Cloud Chat Completions v1, `https://cloud-api.near.ai/v1`
- Default model: `deepseek/deepseek-v3.2`
- OpenAI-compatible TypeScript SDK `7.15.0`
- Zod `4.6.5`
- NEAR API JS `7.4.0` (Issue #10, restricted testnet client)

## Quick start

From the repository root:

```bash
cd agent
npm install
cd ..
cp .env.example .env
```

Set `NEAR_AI_KEY` in the root `.env` file, then return to `agent/`:

```bash
cd agent
npm run typecheck
npm test
npm run smoke
```

`npm test` runs offline against fictional fixtures with mock inference; `npm run smoke` calls the hosted model and may incur charges.

To run the malicious invoice fixture through the real model:

```bash
npm run build
node --env-file-if-exists=../.env dist/src/cli.js fixtures/malicious-invoice.txt
```

The demo CLI prints extracted proposal data. Do not use confidential invoices in this workflow.

## Supported input

```text
Invoice ref: INV-2026-0001
Supplier: Northstar Test Services
Payee NEAR account: merchant.testnet
Amount payable: 1.50 NEAR
```

`Supplier:` is optional. Recipient, invoice reference and NEAR-denominated amount are required. Duplicate labels, conflicting values, invalid amounts and non-NEAR currencies are rejected before inference. PDF, image and unstructured invoice formats are not supported.

## Output

A successful sample run produces:

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

The amount is computed with `BigInt`, not floating-point arithmetic. The proposal is grounded in the labelled source invoice but is **not** proof of invoice authenticity or an approved payment.

## Safety and validation

- Fixed system prompt; invoice contents are passed only as a user message.
- Strict JSON and Zod schemas reject unknown and malformed fields.
- Source validation compares recipient, exact amount, invoice reference and optional supplier with the original text.
- A model-suggested alternate recipient is rejected if it differs from the labelled payee.
- No blockchain signing credentials belong in the inference configuration.
- The NEAR AI key and `.env` file must never be committed.

## Test evidence

On 4 November 2026, the developer reported a passing TypeScript typecheck, **21 passing local unit tests** and two successful live-model tests, including the malicious invoice example. Those results demonstrate the tested cases only and do not establish general prompt-injection resistance.

## Current limitations and dependencies

Issue [#6](https://github.com/El-swaggerito/Nocturne/issues/6) must confirm the final `request_payment` interface, request ID and invoice reference/hash format. Issue [#10](https://github.com/El-swaggerito/Nocturne/issues/10) adds a disabled-by-default restricted testnet client. Do not forward a complete `InvoiceProposal` directly to a contract method.

For fixtures, error handling, field formats and detailed security notes, see [AGENT_UTILISATION.md](./AGENT_UTILISATION.md).


## Issue #10: restricted payment proposal client (testnet only)

The library exports `NearPaymentClient`, `loadNearPaymentConfig`, and
`createNearTestnetTransport` from `src/index.ts`. `npm run smoke` is still
**inference-only**. Nothing in the CLI broadcasts blockchain transactions.

The payment client:

1. Accepts only a strictly validated `InvoiceProposal`. It never calls the
   model as part of transaction signing.
2. Derives a stable invoice-scoped `request_id` and saves a private journal
   entry on disk. Changed amounts or recipients with the same reference fail.
3. Checks the **on-chain** access-key permissions before submission: it must
   be a standard `FunctionCall` key restricted to the configured Guard account
   and exactly the method `request_payment`. FullAccess, wildcard and extra
   methods are rejected.
4. Calls only the `request_payment` change method, attaches **zero deposit**,
   and treats uncertain submissions as `pending`. No automatic resubmission
   occurs after an attempt, including when RPC times out.
5. Captures the transaction hash and finality when RPC returns them. A
   transaction success is **not** confirmation that the asynchronous payment
   settled. `confirmed` requires matching data from a contract status view.
   The provisional read-only `get_payment` getter must match Issue #6.

The **provisional**, not-yet-agreed method arguments are:

```json
{
  "request_id": "req_<32-hex-chars>",
  "recipient_id": "merchant.testnet",
  "amount_yocto": "1500000000000000000000000",
  "invoice_reference": "INV-2026-0001"
}
```

The contract engineer must confirm all names and value representations under
[Issue #6](https://github.com/El-swaggerito/Nocturne/issues/6) **before any
real testnet transaction**. The payment interface may need adaptation.

Copy `.env.example` to an ignored `.env` at repository root, and configure:

- `NEAR_GUARD_ACCOUNT_ID`: deployed Guard **testnet** account
- `NEAR_AGENT_ACCOUNT_ID`: dedicated agent **testnet** account
- `NEAR_AGENT_PRIVATE_KEY`: **restricted** FunctionCall key in local `.env` only
- `NEAR_PAYMENT_JOURNAL_DIR`: durable private journal path, default
  `.local/payment-requests` relative to the process working directory

Do not set `NEAR_ENABLE_TESTNET_WRITES=yes` or
`NEAR_CONTRACT_INTERFACE_AGREED=yes` until the team has approved the testnet
contract interface and Joe has reviewed the access key from Issue #4. Both
flags must be set for the library to broadcast. Keep wallet signing keys on
server-side machines only and never in frontend bundles.

### Verification

```sh
cd agent
npm install               # updates package-lock.json for near-api-js 7.4.0
npm run typecheck
npm test                  # includes near.test.ts with mock transport
npm run smoke             # unchanged invoice-only smoke test
```

The tests use only fake keys and mock transport; no testnet transaction is sent.
Before opening PR #10, commit the updated `agent/package-lock.json` after
`npm install`. No `.env`, signing key or `.local` journal should be committed.

### Retry and status limitations

The request journal and attempt markers are persistent local data. Preserve
and back them up before migrations. The ID is deterministic per network,
contract account, agent account and invoice reference, but **never rely on
local state alone to enforce idempotency**. The contract must reject duplicate
request IDs on-chain. Retrying after a timeout returns the existing pending
record and never broadcasts a second transaction. When the RPC returns no hash,
a human must reconcile the transaction or inspect the on-chain contract audit
trail before any further action.

Issue #14 supplies the real negative-permission and testnet settlement evidence.
Issue #10 alone cannot establish that on-chain owner-only methods are
inaccessible or that money transfers settle correctly.

### Library usage (only after contract and key approvals)

This is an integration example, not a command run by the smoke test:

```ts
import {
  extractInvoiceProposal,
  loadNearPaymentConfig,
  createNearTestnetTransport,
  NearPaymentClient,
} from "./src/index.js";

const proposal = await extractInvoiceProposal(invoiceText);
const client = new NearPaymentClient(
  loadNearPaymentConfig(),
  createNearTestnetTransport(),
);
const result = await client.submit(proposal);
// result.status: prepared | ai_rejected | contract_rejected | pending | confirmed
// A pending result is not a payment confirmation.
```

This client never supplies an owner key or exposes generic owner-only contract
methods. The contract must independently validate the authorised agent,
recipient and spending limits. The CLI's `npm run smoke` remains unchanged.
