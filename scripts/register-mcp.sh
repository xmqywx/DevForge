#!/bin/bash
# Register DevForge MCP server in Claude's settings
SETTINGS="$HOME/.claude/settings.json"
DEVFORGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$SETTINGS', 'utf8'));
if (!settings.mcpServers) settings.mcpServers = {};
settings.mcpServers.devforge = {
  command: 'npx',
  args: ['tsx', '${DEVFORGE_DIR}/mcp-server/index.ts']
};
fs.writeFileSync('$SETTINGS', JSON.stringify(settings, null, 2));
console.log('Registered DevForge MCP server');
"
