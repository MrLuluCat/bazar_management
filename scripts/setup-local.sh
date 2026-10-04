#!/usr/bin/env bash
# One-time local setup: downloads PocketBase, creates the superuser, the group user (passcode) and a workspace.
#   scripts/setup-local.sh            # empty database
#   scripts/setup-local.sh --seed     # plus demo events (Oct/Nov 2026)
# Override defaults with env vars: ADMIN_EMAIL, ADMIN_PASSWORD, GROUP_EMAIL, GROUP_PASSCODE, WORKSPACE_NAME.
set -euo pipefail

PB_VERSION="0.40.4"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PB_DIR="$ROOT/.pb"
DATA_DIR="$PB_DIR/data"
PORT=8090

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@local.test}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin-pass-123}"
GROUP_EMAIL="${GROUP_EMAIL:-grup@bazar.local}"
GROUP_PASSCODE="${GROUP_PASSCODE:-bazar-123}"
WORKSPACE_NAME="${WORKSPACE_NAME:-Bazar Saya}"

case "$(uname -s)" in
  Linux*) OS=linux; BIN=pocketbase ;;
  Darwin*) OS=darwin; BIN=pocketbase ;;
  MINGW*|MSYS*|CYGWIN*) OS=windows; BIN=pocketbase.exe ;;
  *) echo "OS tidak didukung" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) ARCH=arm64 ;;
  *) ARCH=amd64 ;;
esac

mkdir -p "$PB_DIR"
if [ ! -x "$PB_DIR/$BIN" ]; then
  echo "==> download PocketBase $PB_VERSION"
  curl -fsSL -o "$PB_DIR/pb.zip" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
  unzip -oq "$PB_DIR/pb.zip" -d "$PB_DIR" && rm "$PB_DIR/pb.zip"
fi

echo "==> install dependency web"
(cd "$ROOT/web" && npm install)

if [ ! -f "$ROOT/web/.env.local" ]; then
  echo "VITE_GROUP_EMAIL=$GROUP_EMAIL" > "$ROOT/web/.env.local"
  echo "==> dibuat web/.env.local"
fi

echo "==> superuser"
"$PB_DIR/$BIN" superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASSWORD" --dir="$DATA_DIR" --migrationsDir="$ROOT/pb/pb_migrations"

echo "==> jalankan PocketBase sementara"
"$PB_DIR/$BIN" serve --http=127.0.0.1:$PORT --dir="$DATA_DIR" --migrationsDir="$ROOT/pb/pb_migrations" >/dev/null 2>&1 &
PB_PID=$!
trap 'kill $PB_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do
  curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 0.2
done

echo "==> user grup + workspace"
PB_URL="http://127.0.0.1:$PORT" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
GROUP_EMAIL="$GROUP_EMAIL" GROUP_PASSCODE="$GROUP_PASSCODE" WORKSPACE_NAME="$WORKSPACE_NAME" \
node "$ROOT/scripts/bootstrap.js"

if [ "${1:-}" = "--seed" ]; then
  echo "==> data contoh"
  PB_URL="http://127.0.0.1:$PORT" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node "$ROOT/scripts/seed.js"
fi

echo
echo "Selesai. Jalankan:  scripts/dev.sh"
echo "Buka http://localhost:5173  |  kode akses: $GROUP_PASSCODE"
