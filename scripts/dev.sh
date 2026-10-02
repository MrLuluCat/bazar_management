#!/usr/bin/env bash
# Download pinned PocketBase, then run it + vite. Usage: scripts/dev.sh
set -euo pipefail
PB_VERSION="0.40.4"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PB_DIR="$ROOT/.pb"
case "$(uname -s)" in
  Linux*) OS=linux; BIN=pocketbase ;;
  Darwin*) OS=darwin; BIN=pocketbase ;;
  MINGW*|MSYS*|CYGWIN*) OS=windows; BIN=pocketbase.exe ;;
  *) echo "unsupported OS" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|AMD64) ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) ARCH=amd64 ;;
esac
mkdir -p "$PB_DIR"
if [ ! -x "$PB_DIR/$BIN" ]; then
  curl -fsSL -o "$PB_DIR/pb.zip" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
  unzip -oq "$PB_DIR/pb.zip" -d "$PB_DIR" && rm "$PB_DIR/pb.zip"
fi
"$PB_DIR/$BIN" serve --http=127.0.0.1:8090 --dir="$PB_DIR/data" --migrationsDir="$ROOT/pb/pb_migrations" --hooksDir="$ROOT/pb/pb_hooks" &
PB_PID=$!
trap 'kill $PB_PID 2>/dev/null' EXIT
cd "$ROOT/web" && npm run dev
