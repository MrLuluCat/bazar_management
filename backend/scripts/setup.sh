#!/usr/bin/env bash
# One-time local backend setup: downloads PocketBase, creates the superuser, a panel admin, and a first lapak (group user + workspace).
#   bash scripts/setup.sh           # empty database
#   bash scripts/setup.sh --seed    # plus demo events (Oct/Nov 2026)
# Defaults can be overridden with env vars: ADMIN_EMAIL, ADMIN_PASSWORD, GROUP_EMAIL, GROUP_PASSCODE, WORKSPACE_NAME, WORKSPACE_SLUG.
# On the VPS none of this is needed: the first admin is created through the one-time /admin/setup link.
set -euo pipefail

BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND"
source "$BACKEND/scripts/pb-version.sh"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@local.test}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin-pass-123}"
GROUP_EMAIL="${GROUP_EMAIL:-grup@bazar.local}"
GROUP_PASSCODE="${GROUP_PASSCODE:-bazar-123}"
WORKSPACE_NAME="${WORKSPACE_NAME:-Bazar Saya}"
WORKSPACE_SLUG="${WORKSPACE_SLUG:-bazar-saya}"
PORT=8090

ensure_pocketbase

echo "==> npm install (backend)"
npm install --silent

echo "==> superuser"
"./$PB_BIN" superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

echo "==> start PocketBase sementara"
"./$PB_BIN" serve --http=127.0.0.1:$PORT >/dev/null 2>&1 &
PB_PID=$!
trap 'kill $PB_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do
  curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 0.2
done

export PB_URL="http://127.0.0.1:$PORT" ADMIN_EMAIL ADMIN_PASSWORD GROUP_EMAIL GROUP_PASSCODE WORKSPACE_NAME WORKSPACE_SLUG
echo "==> lapak pertama (user grup + workspace)"
node scripts/bootstrap.js

echo "==> admin panel"
node scripts/panel-admin.js

if [ "${1:-}" = "--seed" ]; then
  echo "==> data contoh"
  node scripts/seed.js
fi

echo
echo "Backend siap. Jalankan: npm run dev   (di folder backend)"
echo "Lapak:       http://localhost:5173/l/$WORKSPACE_SLUG   (kode akses: $GROUP_PASSCODE)"
echo "Panel admin: http://localhost:5173/admin   ($ADMIN_EMAIL / $ADMIN_PASSWORD)"
