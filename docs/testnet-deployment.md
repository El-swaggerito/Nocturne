# Nocturne testnet deployment evidence

## Reproducible build

Issue: #14

Source commit:

`97a88bf31d93e2a9311803f87e4845041fe5064a`

Build tool:

`cargo-near 0.22.0`

Reproducible build image:

`sourcescan/cargo-near:0.22.0-rust-1.99.1`

Image digest:

`sha256:c9655eaf7436b90c87ea8b25739f91063032c5c30ba24cfeafe72c142943b5bb`

Command:

```bash
./scripts/build-reproducible.sh
```

Generated contract:

`artifacts/nocturne_guard.wasm`

SHA-256:

`bc17214fd368e2306acf73cf44e29945acfd1fe487e5458c969f800d0a08deb8`

The Wasm artefact is generated locally and is not committed to Git.

## Integration test environment note

The Rust unit suite passes locally with 56/56 tests.

`cargo test -p nocturne_integration_tests` cannot run on the development machine because `near-workspaces 0.24.0` attempts to install `neard-sandbox`, which does not support macOS Intel (`darwin-x86_64`).

Observed error:

`UnsupportedPlatformError("only linux-x86_64, linux-aarch64, and darwin-arm64 are supported")`

This is an environment limitation, not a Nocturne contract test failure. Critical integration behaviour for Issue #14 was verified independently against NEAR testnet with real transactions and restricted access keys.

## Treasury safety buffer

The Guard refuses payments that would reduce its available balance below the contract storage reserve.

- Fixed safety reserve: `1000000000000000000000000` yoctoNEAR (`1 NEAR`)
- Storage reserve also includes `storage_usage * storage_byte_cost`
- Payment callback gas allocation: `25 Tgas`
- Pending and committed spending are tracked separately until asynchronous settlement completes

## Testnet deployment

Deployment completed and verified on NEAR Testnet.

The deployed Guard contract, owner account and restricted agent account remain the authoritative testnet environment used by the Nocturne demo.

Contract account: `nocturne-guard-26.testnet`

Owner account: `nocturne-owner-26.testnet`

Agent account: `nocturne-agent-26.testnet`

Deployment transaction: `9V3V5DAEzAM939x72U5jRt16PNUVe9iHxxMNy8puEU6k`

Initialisation transaction: `J3obXJdqLM1bgtoGYwZHkKMEFHJNGpqJt6XhrWoHxWAB`

Restricted agent key verification:

- Agent account: `nocturne-agent-26.testnet`
- Restricted public key: `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Receiver: `nocturne-guard-26.testnet`
- Allowed methods: `request_payment`
- Allowance: `0.25 NEAR`
- Add-key transaction: `FBXX3XfRNqWBotPsgLYBMqwmQP458wT94CB2ganyy1D8`
- Original FullAccess recovery key remains stored locally and must not be exposed to the AI runtime.

Restricted `request_payment` evidence:

- Restricted key: `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Transaction: `5pUBHepvnWGBeA9jXejh2jjz9Sy7me6hFUBRTLLginVn`
- NEAR accepted the function-call key for `request_payment`.
- The Guard then rejected the proposal with `RecipientNotApproved`, confirming contract policy remained authoritative.

Valid payment evidence:

- Request ID: `req_00000000000000000000000000000001`
- Recipient: `nocturne-owner-26.testnet`
- Amount: `10000000000000000000000` yoctoNEAR (`0.01 NEAR`)
- Signing key: restricted function-call key `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Transaction: `5UamW1WkPpq2N3zAVS9EfW71pfEaQczbvAmiQ3hQbPNC`
- Contract log: `payment_pending:req_00000000000000000000000000000001`
- Callback log: `payment_confirmed:req_00000000000000000000000000000001`
- Final payment status: `confirmed`
- Daily committed after settlement: `10000000000000000000000`
- Pending total after settlement: `0`


Spending-limit violation evidence:

- Request ID attempted: `req_00000000000000000000000000000002`
- Amount attempted: `60000000000000000000000` yoctoNEAR (`0.06 NEAR`)
- Per-transaction limit: `50000000000000000000000` yoctoNEAR (`0.05 NEAR`)
- Signing key: restricted function-call key `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Transaction: `1qxuAUWbG59W1yNSptke7MozSnn4hmS1dadcDCRMyrj`
- Result: `Policy rejected: TransactionLimitExceeded`
- Next request ID remained `req_00000000000000000000000000000002`
- Daily committed remained `10000000000000000000000`
- Pending total remained `0`
- No payment record was created.

Emergency-freeze evidence:

- Freeze transaction: `88haVM3exKauY7ctkffJPVgx6ZfBDVtgc4VeaKXe7Dgi`
- Frozen state verified as `true`.
- Restricted agent attempted request ID `req_00000000000000000000000000000002`.
- Attempted amount: `10000000000000000000000` yoctoNEAR (`0.01 NEAR`).
- Rejected payment transaction: `GfnNexYBimJ92uyPWtSRgZk9knJxzuKmxwa2pDLbBXwZ`
- Result: `Policy rejected: Frozen`
- Next request ID remained `req_00000000000000000000000000000002`.
- Daily committed remained `10000000000000000000000`.
- Pending total remained `0`.
- No payment record was created.

Post-demo state:

- The owner restored the Guard to `frozen = false`.
- Unfreeze transaction: `DzAFCbyqqsn3JGsUPcNieTGQcVt7ELvQSLuyQFm7A2fc`
- `is_frozen` was verified as `false` afterwards.

Forbidden owner-method evidence:

- Method attempted: `set_frozen`
- Signing key: `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Result: rejected by NEAR access-key permissions before contract execution.
- Error: `Transaction method name <set_frozen> isn't allowed by the access key.`
- No transaction ID was produced because the transaction was rejected before execution.

## Final end-to-end dashboard payment evidence

The production dashboard and agent payment path were later verified with an explicitly authorised `0.01 NEAR` Testnet payment.

- Invoice reference: `DASHBOARD-LIVE-002`
- Recipient: `nocturne-owner-26.testnet`
- Amount: `10000000000000000000000` yoctoNEAR (`0.01 NEAR`)
- Request ID: `req_00000000000000000000000000000003`
- Final contract status: `confirmed`
- Verification result: `verified_contract_settlement`
- Next request ID after settlement: `req_00000000000000000000000000000004`
- Pending total after settlement: `0`

This payment was submitted only after explicit approval. The public production deployment currently keeps automated Testnet writes disabled.

## Final security demonstration evidence

Additional on-chain security scenarios were verified after the initial deployment run.

### Unapproved recipient rejection

Transaction:

`4fLL4p5gLyx4gqLUZiZqvxvwRDBinsDthZW2gYonJriQ`

The Guard rejected the payment because the recipient was not approved.

### Per-transaction limit rejection

Transaction:

`3jjt6GrLXcH23qSiDBvfU5o8YHRCCVFzFhhXsgXS4NNk`

The attempted payment exceeded the configured per-transaction limit.

### Daily-limit rejection

Transaction:

`4RNrJkLoL5vmjCDbG2D8mZV2ePFnTXrp7qB2uWv8Kw2V`

The Guard rejected the payment because the remaining daily allowance was insufficient.

### Emergency freeze

Freeze transaction:

`7ESDzrwY6xw7ebfGqYSgfiz7Be6VzoSMAcj9u64ddJ53`

Payment rejected while frozen:

`GJenpJbvrWMTU5gpMK2cxM9PEo1izaToAbMcvVbqkGy7`

Unfreeze transaction:

`4oTdxNNrwtH9t4WghjwZ22BGDMBVXUffKJMSM7DvF5Rk`

These transactions demonstrate that the Guard contract, rather than the AI agent or dashboard, remains the final authority over payment execution.

