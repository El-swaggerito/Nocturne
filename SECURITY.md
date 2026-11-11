# Security

Nocturne is hackathon software under active development. **It hasn't been
audited.** Don't use it with mainnet funds.

## Reporting a vulnerability

Please don't open a public issue for security problems. Report them privately
through GitHub's **Security → Report a vulnerability** on this repository, or
contact a maintainer directly. Include steps to reproduce and, where relevant,
testnet transaction IDs.

## Security model in one paragraph

The AI agent is **untrusted**. It can only propose payments, by calling
`request_payment` on the Guard contract with a NEAR function-call access key
limited to that one method. The Guard contract is the only authority: it
checks the caller, the frozen flag, the owner-managed recipient allowlist and
the per-payment and daily caps, all on-chain, before any NEAR moves. Invoice
text, model output and the dashboard are all treated as untrusted input. A
fully compromised agent can, at worst, pay approved recipients within the caps
until the owner freezes the Guard.

Full details: [`docs/security/threat-model.md`](docs/security/threat-model.md).

## Rules for contributors

- Never commit credentials, wallet keys, seed phrases, `.env` files, NEAR AI
  API keys or real invoices. `.gitignore` covers `.env*`, `*.key` and
  `*.pem`. Don't rely on that alone.
- Every state-changing contract method must check `predecessor_account_id`
  on-chain. UI checks aren't security.
- Use checked integer arithmetic for all yoctoNEAR amounts. Never use floats.
- Changes to authorisation, payments, callbacks or access keys need review
  from the security lead.
- Don't claim test coverage you don't have. Unit-test mocks don't prove
  receipt or callback behaviour; those need sandbox or testnet evidence.

## Current status

| Control | Status |
|---|---|
| Owner-only freeze, owner ≠ agent at init | Implemented (#1) |
| Only the owner can initialise the contract | Implemented (#3) |
| Agent-only `request_payment` | Implemented (#3, #6) |
| Owner-only agent rotation | **Missing** (review finding F4) |
| Limits, allowlist, freeze enforcement | Implemented (#5) |
| Reserved payments, private callback, dedupe | Implemented (#6). F1/F2/F3 remediations merged and regression-tested |
| Restricted agent access key | Verified on NEAR testnet with a restricted FunctionCall key limited to `request_payment` (#14) |
| Agent client refuses non-restricted keys | Implemented (#10) |
| Adversarial and sandbox tests | Implemented (#7). See [`docs/security/contract-review.md`](docs/security/contract-review.md) |

Security review findings and their current remediation status are documented in
[`docs/security/contract-review.md`](docs/security/contract-review.md).
F1, F2 and F3 are fixed. F4, owner-controlled agent rotation, remains a documented design gap and is outside the hackathon MVP.
