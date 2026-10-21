#!/usr/bin/env bash
# Ships the API and the demo site to the droplet.
#   ./deploy/deploy.sh            # uses the "droplet" host from ~/.ssh/config
#   ./deploy/deploy.sh user@host
set -euo pipefail

HOST="${1:-droplet}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ API"
rsync -az --delete --exclude node_modules --exclude '.env*' --exclude test --exclude bin --exclude .DS_Store \
  "$ROOT/backend/" "$HOST:/opt/raptor/backend/"
ssh "$HOST" 'cd /opt/raptor/backend && docker compose up -d --build --remove-orphans && docker image prune -f > /dev/null'

echo "→ Demo site (fresh fake keys every deploy)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
node "$ROOT/demo/generate.mjs" "$TMP" > /dev/null
rsync -a --delete "$TMP/" "$HOST:/var/www/raptor-demo/"
ssh "$HOST" 'chmod -R a+rX /var/www/raptor-demo'

echo "→ Health"
ssh "$HOST" 'for i in $(seq 1 30); do curl -sf 127.0.0.1:3100/api/v1/health && exit 0; sleep 1; done; exit 1'
echo
