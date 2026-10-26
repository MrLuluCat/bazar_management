#!/usr/bin/env bash
# First-time setup for local development: backend (PocketBase + accounts) and frontend (npm packages).
#   ./setup.sh          # empty database
#   ./setup.sh --seed   # with demo events
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

bash "$ROOT/backend/scripts/setup.sh" "${1:-}"

echo "==> npm install (frontend)"
(cd "$ROOT/frontend" && npm install --silent)
[ -f "$ROOT/frontend/.env.local" ] || cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env.local"

echo
echo "Selesai. Jalankan: ./dev.sh   lalu buka http://localhost:5173"
