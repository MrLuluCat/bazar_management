#!/usr/bin/env bash
# Run PocketBase locally on http://127.0.0.1:8090 (API + admin UI at /_/).
set -euo pipefail
BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND"
source "$BACKEND/scripts/pb-version.sh"
ensure_pocketbase
# --origins: allowed browser origins (CORS). Local frontend runs on :5173.
exec "./$PB_BIN" serve --http=127.0.0.1:8090 --origins="${PB_ORIGINS:-http://localhost:5173,http://localhost:4173}"
