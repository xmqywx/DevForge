#!/bin/bash
# DevForge Plugin Installer — clone + symlink for auto-updates
set -e

REPO="https://github.com/xmqywx/DevForge.git"
INSTALL_DIR="${HOME}/.devforge/repo"
PLUGIN_CACHE="${HOME}/.claude/plugins/cache/devforge/devforge/1.0.0"
MARKETPLACE_DIR="${HOME}/.claude/plugins/marketplaces/devforge"

echo ""
echo "  ⚡ DevForge Installer"
echo "  ─────────────────────"
echo ""

# 1. Clone or pull
if [ -d "$INSTALL_DIR" ]; then
  echo "  Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --ff-only
else
  echo "  Cloning DevForge..."
  mkdir -p "$(dirname $INSTALL_DIR)"
  git clone "$REPO" "$INSTALL_DIR"
fi

# 2. Install dependencies
echo "  Installing dependencies..."
cd "$INSTALL_DIR" && npm install --silent

# 3. Create DB
echo "  Setting up database..."
cd "$INSTALL_DIR" && npx drizzle-kit push 2>/dev/null

# 4. Symlink plugin cache
echo "  Linking plugin..."
mkdir -p "$(dirname $PLUGIN_CACHE)"
rm -rf "$PLUGIN_CACHE"
ln -s "$INSTALL_DIR" "$PLUGIN_CACHE"

# 5. Register marketplace
mkdir -p "$MARKETPLACE_DIR/.claude-plugin"
cp "$INSTALL_DIR/.claude-plugin/marketplace.json" "$MARKETPLACE_DIR/.claude-plugin/marketplace.json"

# 6. Update installed_plugins.json
PLUGINS_FILE="${HOME}/.claude/plugins/installed_plugins.json"
if [ -f "$PLUGINS_FILE" ]; then
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$PLUGINS_FILE', 'utf8'));
    if (!data.plugins) data.plugins = {};
    data.plugins['devforge@devforge'] = [{
      scope: 'user',
      installPath: '$PLUGIN_CACHE',
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }];
    fs.writeFileSync('$PLUGINS_FILE', JSON.stringify(data, null, 2));
  "
fi

# 7. Register MCP server
echo "  Registering MCP server..."
bash "$INSTALL_DIR/scripts/register-mcp.sh" 2>/dev/null

echo ""
echo "  ✅ DevForge installed!"
echo ""
echo "  Restart Claude Code, then use:"
echo "    /devforge:init       — Initialize"
echo "    /devforge:df-status  — Project status"
echo "    /devforge:df-issues  — View issues"
echo ""
echo "  To update later:  cd ~/.devforge/repo && git pull"
echo "  Auto-updates:     Changes sync instantly (symlinked)"
echo ""
