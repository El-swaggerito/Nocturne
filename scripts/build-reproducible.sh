#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/artifacts"

cd "${ROOT_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: Docker is required for reproducible builds" >&2
  exit 1
fi

if ! cargo near --version >/dev/null 2>&1; then
  echo "error: cargo-near is required" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: reproducible build requires a clean Git working tree" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

echo "Source commit: $(git rev-parse HEAD)"
echo "cargo-near: $(cargo near --version)"
echo "Building Guard reproducibly..."

cargo near build reproducible-wasm   --manifest-path contracts/guard/Cargo.toml   --out-dir "${OUT_DIR}"

echo
echo "Artifacts:"
ls -lh "${OUT_DIR}"
