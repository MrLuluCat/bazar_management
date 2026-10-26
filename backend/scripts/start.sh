#!/usr/bin/env bash
# Production-like local run: build the frontend into pb_public/ and serve app + API
# from one PocketBase on http://127.0.0.1:8090 (same setup as the VPS).
set -euo pipefail
BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND"
source "$BACKEND/scripts/pb-version.sh"
ensure_pocketbase

echo "==> build frontend -> pb_public/"
(cd "$BACKEND/../frontend" && npm run build:pb)

echo "==> http://127.0.0.1:8090 (Ctrl+C to stop)"
exec "./$PB_BIN" serve --http=127.0.0.1:8090
