#!/bin/bash
# Start DevForge MCP server with correct working directory
cd "$(dirname "$0")/.."
exec node_modules/.bin/tsx mcp-server/index.ts
