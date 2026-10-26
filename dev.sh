#!/usr/bin/env bash
# Run backend (PocketBase :8090) and frontend (Vite :5173) together. Ctrl+C stops both.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

bash "$ROOT/backend/scripts/dev.sh" &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT

cd "$ROOT/frontend" && npm run dev
