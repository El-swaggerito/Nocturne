# Demo evidence

Store **sanitised** evidence from the real testnet run here, one file per
scenario (`s1.md`, `s2a.md`, …), or fill the blanks in `../scenarios.md`.

## Keep
- Transaction hashes and their testnet explorer links
  (`https://testnet.nearblocks.io/txns/<hash>`). Open each link and check it
  before recording it.
- Exact contract error text, e.g. `Policy rejected: RecipientNotApproved`.
- Output of the view calls (`get_policy`, `get_spending`, `get_payment`)
  and of `view-account-summary` balances before and after.
- Agent output: the proposal JSON, its validation result and the
  submit result (`ai_rejected`, `contract_rejected`, `pending`, `confirmed`).
- The `list-keys` output for the agent account (public keys only).
- A link to the screen recording. Store the video outside Git if it's large.

## Never keep
- Private keys (`ed25519:` secret values), seed phrases, `.env` files,
  `NEAR_AI_KEY`, browser wallet screens showing secrets.
- The agent journal folder (`.local/payment-requests`). Quote the fields you
  need instead.
- Anything from a real invoice or a real person.

Before committing, run:
```bash
git diff --cached | grep -nE 'ed25519:[1-9A-HJ-NP-Za-km-z]{60,}|NEAR_AI_KEY=|PRIVATE_KEY=' \
  && echo "STOP: possible secret" || echo "no secrets found"
```
Public keys (`ed25519:` with about 44 characters) are fine. Secret keys are
much longer and must never appear.
