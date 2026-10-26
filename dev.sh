#!/usr/bin/env bash
# Run backend (PocketBase :8090) and frontend (Vite :5173) together. Ctrl+C stops both.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

bash "$ROOT/backend/scripts/dev.sh" &
BACKEND_PID=$!
(cd "$ROOT/frontend" && exec npm run dev) &
FRONTEND_PID=$!

# On Windows (Git Bash) killing the bash job leaves pocketbase.exe / node running and the ports busy,
# so also kill each job's Windows process tree.
stop() {
  trap - INT TERM EXIT
  for pid in $BACKEND_PID $FRONTEND_PID; do
    if [ -r "/proc/$pid/winpid" ] && command -v taskkill >/dev/null 2>&1; then
      taskkill //F //T //PID "$(cat "/proc/$pid/winpid")" >/dev/null 2>&1
    fi
    kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  echo "dev.sh: backend dan frontend dihentikan."
}
trap stop INT TERM EXIT

# Stop everything as soon as either side exits (e.g. port already in use).
wait -n
