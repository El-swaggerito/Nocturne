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

## Testnet deployment

Not performed yet.

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


Forbidden owner-method evidence:

- Method attempted: `set_frozen`
- Signing key: `ed25519:7tuTJ6k7DwQZ5GsJC6N9xpLJBzZgZ3tkzKuAXe7ehsgg`
- Result: rejected by NEAR access-key permissions before contract execution.
- Error: `Transaction method name <set_frozen> isn't allowed by the access key.`
- No transaction ID was produced because the transaction was rejected before execution.
