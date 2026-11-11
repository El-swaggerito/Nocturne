#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_PATH="${ROOT_DIR}/artifacts/nocturne_guard.wasm"

: "${NEAR_GUARD_ACCOUNT_ID:?NEAR_GUARD_ACCOUNT_ID is required}"

if [[ "${NEAR_GUARD_ACCOUNT_ID}" != *.testnet ]]; then
  echo "error: refusing non-testnet contract account: ${NEAR_GUARD_ACCOUNT_ID}" >&2
  exit 1
fi

if [[ ! -f "${WASM_PATH}" ]]; then
  echo "error: missing ${WASM_PATH}" >&2
  echo "run ./scripts/build-reproducible.sh first" >&2
  exit 1
fi

echo "Network: testnet"
echo "Guard account: ${NEAR_GUARD_ACCOUNT_ID}"
echo "Wasm: ${WASM_PATH}"
echo "SHA-256:"
shasum -a 256 "${WASM_PATH}"

if [[ "${NOCTURNE_EXECUTE:-0}" != "1" ]]; then
  echo
  echo "DRY RUN ONLY"
  echo "Set NOCTURNE_EXECUTE=1 only after explicit deployment approval."
  exit 0
fi

near contract deploy "${NEAR_GUARD_ACCOUNT_ID}"   use-file "${WASM_PATH}"   without-init-call   network-config testnet   sign-with-keychain   send
