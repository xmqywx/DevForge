---
name: init
description: Initialize DevForge — create DB, register MCP, scan git repos, detect current project
---

## DevForge Init

Run these steps in order using Bash commands (NOT MCP tools — they may not be loaded yet):

### Step 1: Check if DB exists
```bash
ls -la ~/.devforge/devforge.db 2>/dev/null
```
If not found:
```bash
cd /Users/ying/Documents/DevForge && npx drizzle-kit push
```

### Step 2: Check MCP Server registration
```bash
grep -q "devforge" ~/.claude.json 2>/dev/null && echo "MCP registered" || echo "MCP not registered"
```
If not registered:
```bash
bash /Users/ying/Documents/DevForge/scripts/register-mcp.sh
```
Tell user to restart Claude Code for MCP to take effect.

### Step 3: Detect current project
```bash
git remote get-url origin 2>/dev/null
basename $(pwd)
```
Then query the DB directly:
```bash
SLUG=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
sqlite3 ~/.devforge/devforge.db "SELECT slug, name, stage, progress_pct, progress_phase FROM projects WHERE slug = '$SLUG'"
```
If found, show project info. If not found, ask user if they want to register it.

### Step 4: Load project context
```bash
SLUG=$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
PROJECT_ID=$(sqlite3 ~/.devforge/devforge.db "SELECT id FROM projects WHERE slug = '$SLUG'")
if [ -n "$PROJECT_ID" ]; then
  echo "Open Issues:"
  sqlite3 ~/.devforge/devforge.db "SELECT '[' || priority || '] #' || id || ' ' || title FROM issues WHERE project_id = $PROJECT_ID AND status IN ('open','in-progress') ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END"
  echo "Feedback:"
  sqlite3 ~/.devforge/devforge.db "SELECT COUNT(*) || ' feedback items' FROM feedback WHERE project_id = $PROJECT_ID AND status = 'open'"
fi
```

### Step 5: Scan (if needed)
If project not found in DB, or user requests a scan:
```bash
cd /Users/ying/Documents/DevForge && npx tsx cli/index.ts scan
```

### Step 6: Load MCP tools
After init is complete, run ToolSearch to load DevForge MCP tools:
```
ToolSearch("devforge")
```
This makes all devforge_* MCP tools available for the rest of the session.

### Step 7: Report
Show: project count, current project context, open issues, "DevForge is ready!"

Also remind: MCP tools are now loaded. You can use devforge_add_issue, devforge_update_issue, etc. for the rest of this session.
