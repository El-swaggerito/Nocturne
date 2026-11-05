# Nocturne AI Agent

This TypeScript package extracts **candidate payment fields** from explicitly labelled text invoices using NEAR AI Cloud. It validates the response against strict Zod schemas and checks extracted payment details against the original invoice labels.

**It does not authorise payments, sign NEAR transactions or call the Guard contract.**

For the complete operating guide, see [AGENT_UTILISATION.md](./AGENT_UTILISATION.md).

## Stack

- Node.js `>=22.16.0`, TypeScript `5.8.3`
- NEAR AI Cloud Chat Completions v1, `https://cloud-api.near.ai/v1`
- Default model: `deepseek/deepseek-v3.2`
- OpenAI-compatible TypeScript SDK `7.15.0`
- Zod `4.6.5`

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

Issue [#6](https://github.com/El-swaggerito/Nocturne/issues/6) must confirm the final `request_payment` interface, request ID and invoice reference/hash format. Issue [#10](https://github.com/El-swaggerito/Nocturne/issues/10) will implement the restricted on-chain client. Do not forward a complete `InvoiceProposal` directly to a contract method.

For fixtures, error handling, field formats and detailed security notes, see [AGENT_UTILISATION.md](./AGENT_UTILISATION.md).
