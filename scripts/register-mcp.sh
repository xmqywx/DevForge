#!/bin/bash
# Register DevForge MCP server in Claude's config
CONFIG="$HOME/.claude.json"
DEVFORGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$CONFIG" ]; then
  echo '{}' > "$CONFIG"
fi

node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG', 'utf8'));
if (!config.mcpServers) config.mcpServers = {};
config.mcpServers.devforge = {
  command: '${DEVFORGE_DIR}/node_modules/.bin/tsx',
  args: ['${DEVFORGE_DIR}/mcp-server/index.ts'],
  cwd: '${DEVFORGE_DIR}'
};
fs.writeFileSync('$CONFIG', JSON.stringify(config, null, 2));
console.log('Registered DevForge MCP server in ~/.claude.json');
"
