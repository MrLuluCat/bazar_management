#!/usr/bin/env bash
# Deploy backend changes (migrations + hooks) to the VPS and restart PocketBase.
#   DEPLOY_HOST=user@vps npm run deploy        (from the backend folder)
# Never touches pb_data/ (database + uploads).
set -euo pipefail

: "${DEPLOY_HOST:?set DEPLOY_HOST, e.g. deploy@vps.example.com}"
REMOTE_DIR="${REMOTE_DIR:-/opt/bazar}"
HEALTH_URL="${HEALTH_URL:-https://api-bazar.nasfcakes.cloud/api/health}"
BACKEND="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> upload migrations + hooks"
rsync -az --delete "$BACKEND/pb_migrations/" "$DEPLOY_HOST:$REMOTE_DIR/pb_migrations/"
rsync -az --delete "$BACKEND/pb_hooks/" "$DEPLOY_HOST:$REMOTE_DIR/pb_hooks/"

echo "==> restart"
ssh "$DEPLOY_HOST" "sudo systemctl restart bazar"

echo "==> health"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "ok: $HEALTH_URL"
    exit 0
  fi
  sleep 2
done
echo "health check failed: $HEALTH_URL" >&2
exit 1
