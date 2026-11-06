# Nocturne security demo (Issue #15)

Four security scenarios run on **NEAR testnet** with the real Guard contract
and real agent output. The step-by-step run sheet, with blanks for evidence,
is in [`scenarios.md`](scenarios.md).

**Status:** prepared, **not yet run**. It depends on the testnet deployment
(#14). No results in this folder are real until the blanks in
`scenarios.md` are filled from an actual run.

## Ground rules

- **Testnet only.** Never mainnet.
- **Don't send any transaction until the team owner has explicitly approved
  the run** (contribution rules: no on-chain changes without approval).
- **Never fake anything.** If the AI model ignores the injection, or a step
  behaves differently than expected, record what actually happened. A
  surprising real result is better evidence than an expected fake one.
- **Keep the three layers separate** in every write-up:
  1. **AI layer**: what the model proposed, and whether the agent's own
     validation accepted it.
  2. **Attempted call**: the exact `request_payment` arguments sent, and by whom.
  3. **Chain outcome**: the transaction hash, success or the exact
     contract error, and balances before and after.
- **No secrets** in recordings, screenshots, logs or this folder: no
  private keys, `.env` contents, seed phrases or NEAR AI keys. See
  [`evidence/README.md`](evidence/README.md).

## What you need before the run

| # | Prerequisite | Owner |
|---|---|---|
| P1 | Guard deployed to testnet from a recorded commit; contract account noted (#14) | El-swaggerito |
| P2 | Review findings F2 and F3 fixed, or noted as known in the write-up (`docs/security/contract-review.md`) | El-swaggerito |
| P3 | Team-controlled testnet accounts: owner, agent, `nocturne-merchant.testnet`, `nocturne-attacker.testnet`. If a name is taken, pick another and edit **all** files in `fixtures/` to match | Team |
| P4 | Agent restricted key set up exactly as `docs/security/agent-permissions.md` §3–§4, and the `list-keys` output saved | Apexcomrade |
| P5 | A way to submit an agent proposal to the chain. The agent library has `NearPaymentClient.submit`, but there's **no command for it yet**. Ask Lakes41 for a small runner (`invoice file → extract → submit → print result`). Fallback in `scenarios.md` | Lakes41 |
| P6 | `.env` at the repo root with `NEAR_AI_KEY`, `NEAR_GUARD_ACCOUNT_ID`, `NEAR_AGENT_ACCOUNT_ID`, `NEAR_AGENT_PRIVATE_KEY`, and only on demo day `NEAR_ENABLE_TESTNET_WRITES=yes` and `NEAR_CONTRACT_INTERFACE_AGREED=yes` | Lakes41 / Apexcomrade |
| P7 | `near` CLI ([near-cli-rs](https://github.com/near/near-cli-rs)) installed; owner key and agent key available to it (§0 of `scenarios.md`) | Whoever runs it |
| P8 | Screen recorder running, with terminal font large enough to read | Whoever runs it |

## Files

| File | Purpose |
|---|---|
| `scenarios.md` | Run sheet: setup, the four scenarios, expected results, evidence blanks, sign-off |
| `fixtures/*.txt` | Fictional invoices for each scenario. Never use real invoices |
| `evidence/README.md` | What evidence to keep, and how to sanitise it |
