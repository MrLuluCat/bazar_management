#!/usr/bin/env bash
# Deploy the SPA + migrations to the VPS. Run locally from the repo root.
#   DEPLOY_HOST=user@vps VITE_GROUP_EMAIL=grup@example.com scripts/deploy.sh
# Never touches pb_data/ (database + uploads).
set -euo pipefail

: "${DEPLOY_HOST:?set DEPLOY_HOST, e.g. deploy@vps.example.com}"
: "${VITE_GROUP_EMAIL:?set VITE_GROUP_EMAIL (the group user's email, baked into the build)}"
REMOTE_DIR="${REMOTE_DIR:-/opt/bazar}"
HEALTH_URL="${HEALTH_URL:-https://bazar.nasfcakes.cloud/api/health}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> build"
(cd "$ROOT/web" && npm ci && npm run build)

echo "==> upload"
rsync -az --delete "$ROOT/web/dist/" "$DEPLOY_HOST:$REMOTE_DIR/pb_public/"
rsync -az --delete "$ROOT/pb/pb_migrations/" "$DEPLOY_HOST:$REMOTE_DIR/pb_migrations/"

echo "==> restart"
ssh "$DEPLOY_HOST" "sudo systemctl restart bazar"

echo "==> health"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "ok: $HEALTH_URL"
    exit 0
  fi
  sleep 2
done
echo "health check failed: $HEALTH_URL" >&2
exit 1
