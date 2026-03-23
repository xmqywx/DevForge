#!/bin/bash
# Auto-sync to server after data changes
# Called by session-start hook and can be triggered manually

DEVFORGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DEVFORGE_DIR"

# Source env
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Only sync if server URL is configured
if [ -z "$DEVFORGE_SERVER_URL" ]; then
  exit 0
fi

# Run sync in background (don't block)
nohup node_modules/.bin/tsx scripts/sync.ts both > /tmp/devforge-sync.log 2>&1 &
