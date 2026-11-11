#!/usr/bin/env bash
set -euo pipefail

: "${NEAR_GUARD_ACCOUNT_ID:?NEAR_GUARD_ACCOUNT_ID is required}"
: "${NEAR_OWNER_ACCOUNT_ID:?NEAR_OWNER_ACCOUNT_ID is required}"
: "${NEAR_AGENT_ACCOUNT_ID:?NEAR_AGENT_ACCOUNT_ID is required}"

for account in   "${NEAR_GUARD_ACCOUNT_ID}"   "${NEAR_OWNER_ACCOUNT_ID}"   "${NEAR_AGENT_ACCOUNT_ID}"
do
  if [[ "${account}" != *.testnet ]]; then
    echo "error: refusing non-testnet account: ${account}" >&2
    exit 1
  fi
done

if [[ "${NEAR_GUARD_ACCOUNT_ID}" == "${NEAR_OWNER_ACCOUNT_ID}" ]] ||    [[ "${NEAR_GUARD_ACCOUNT_ID}" == "${NEAR_AGENT_ACCOUNT_ID}" ]] ||    [[ "${NEAR_OWNER_ACCOUNT_ID}" == "${NEAR_AGENT_ACCOUNT_ID}" ]]; then
  echo "error: Guard, owner and agent accounts must be distinct" >&2
  exit 1
fi

INIT_ARGS=$(printf '{"owner_id":"%s","agent_id":"%s"}' "$NEAR_OWNER_ACCOUNT_ID" "$NEAR_AGENT_ACCOUNT_ID")
echo "Network: testnet"
echo "Guard: ${NEAR_GUARD_ACCOUNT_ID}"
echo "Owner: ${NEAR_OWNER_ACCOUNT_ID}"
echo "Agent: ${NEAR_AGENT_ACCOUNT_ID}"
echo "Constructor: new"
echo "Arguments: ${INIT_ARGS}"

if [[ "${NOCTURNE_EXECUTE:-0}" != "1" ]]; then
  echo
  echo "DRY RUN ONLY"
  echo "Set NOCTURNE_EXECUTE=1 only after explicit initialisation approval."
  exit 0
fi

near contract call-function as-transaction   "${NEAR_GUARD_ACCOUNT_ID}"   new   json-args "${INIT_ARGS}"   prepaid-gas "30 Tgas"   attached-deposit "0 NEAR"   sign-as "${NEAR_OWNER_ACCOUNT_ID}"   network-config testnet   sign-with-keychain   send
