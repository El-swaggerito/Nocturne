# Nocturne sandbox integration tests

These tests compile the real Guard contract to Wasm, deploy it to a local
NEAR node ("sandbox") and call it with real transactions. They cover
behaviour unit tests can't prove, such as receipts, callbacks and
transaction failures (Issue #7). Nothing here touches testnet or mainnet.

## One-time setup

1. **Rust** (stable) with the Wasm target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
2. **Linux only**: system packages needed to build `cargo-near`:
   ```bash
   sudo apt-get install -y libudev-dev pkg-config
   ```
   macOS needs nothing extra. On Windows, use WSL (Ubuntu) and follow the
   Linux steps.
3. **cargo-near**, which the tests use to build the contract:
   ```bash
   cargo install cargo-near --locked
   cargo near --version
   ```
   This takes several minutes the first time.

The sandbox node binary (`neard`) is downloaded automatically on the first
test run and cached.

## Run

From the repository root:
```bash
cargo test -p nocturne_integration_tests
```
The first run is slow (it downloads `neard` and builds the contract).

## Troubleshooting

| Error | Fix |
|---|---|
| `no such command: near` | Install `cargo-near` (setup step 3) |
| `failed to run custom build command for hidapi` | Install `libudev-dev` and `pkg-config` (setup step 2) |
| `couldn't set the file descriptor limit to (65535, 65535)` | The machine limits open files. Run `ulimit -n 65535` in the same terminal first. If that's refused (some containers and CI runners), run the tests on another machine |
| Port or "address in use" errors | Another sandbox is still running. Close it or wait a few seconds |
