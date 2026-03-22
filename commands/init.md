---
name: init
description: Initialize DevForge — create DB, register MCP, scan git repos, detect current project
---

## DevForge Init

Run these steps in order:

### Step 1: Check if DB exists
Run: `ls -la ~/.devforge/devforge.db 2>/dev/null`
If not found, run: `cd {DEVFORGE_DIR} && npx drizzle-kit push`

### Step 2: Register MCP Server
Check if devforge is in `~/.claude/settings.json` mcpServers.
If not, run: `cd {DEVFORGE_DIR} && bash scripts/register-mcp.sh`
Tell user to restart Claude Code for MCP to take effect.

### Step 3: Detect current project
Check current working directory for `.git`:
- Run `git remote get-url origin 2>/dev/null` and `basename $(pwd)`
- Use MCP tool `devforge_list_projects` to check if this repo is registered
- If found: load context with `devforge_get_project`
- If not found: ask if user wants to register it

### Step 4: First-time scan
If DB has 0 projects, trigger `devforge_scan` MCP tool.

### Step 5: Report
Show: project count, current project context, open issues, "DevForge is ready!"
