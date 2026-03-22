# DevForge Plan 2: Claude Plugin + MCP Server + CLI

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code Plugin (`/devforge:*` commands), MCP Server (8 tools for auto context), and CLI binary (`devforge` command) that all read/write the same SQLite database from Plan 1.

**Architecture:** Plugin commands are `.md` prompt files under `.claude-plugin/`. MCP Server is a TypeScript process using `@modelcontextprotocol/sdk`. CLI uses `commander.js`. All three share `src/db/` and `src/lib/queries.ts` from Plan 1.

**Tech Stack:** @modelcontextprotocol/sdk, commander.js, Drizzle ORM (shared from Plan 1)

**Spec:** `docs/specs/2026-03-23-devforge-design.md` — sections "Plugin Structure", "Slash Commands Detail", "MCP Server Tools"

**Depends on:** Plan 1 complete (DB, scanner, queries)

---

## File Structure (additions to Plan 1)

```
devforge/
├── .claude-plugin/
│   └── manifest.json
├── commands/                     # Slash command prompt files
│   ├── init.md
│   ├── status.md
│   ├── issues.md
│   ├── add-issue.md
│   ├── note.md
│   ├── summary.md
│   ├── progress.md
│   ├── configure.md
│   └── open.md
├── mcp-server/
│   ├── index.ts                  # MCP server entry (stdio transport)
│   └── tools.ts                  # All 8 tool definitions + handlers
├── cli/
│   └── index.ts                  # devforge CLI entry
├── scripts/
│   ├── status.sh                 # Deterministic status report
│   ├── next-issue.sh             # Next actionable issue
│   └── blocked.sh                # Blocked issues
└── src/
    └── lib/
        └── queries.ts            # (from Plan 1, extend with MCP-facing queries)
```

---

## Chunk 1: MCP Server

### Task 1: MCP Server setup

**Files:**
- Create: `mcp-server/index.ts`
- Create: `mcp-server/tools.ts`

- [ ] **Step 1: Install MCP SDK**

```bash
npm install @modelcontextprotocol/sdk
```

- [ ] **Step 2: Write MCP tools**

`mcp-server/tools.ts`:
```typescript
import { db } from "../src/db/client";
import { projects, issues, notes, gitSnapshots } from "../src/db/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import { getNextActionableIssues, getBlockedIssues, getProjectWithGit, getOverviewStats } from "../src/lib/queries";
import { seedFromScan } from "../src/db/seed";

export const TOOLS = [
  {
    name: "devforge_list_projects",
    description: "List all projects with status summary. Returns name, stage, progress, open issue count for each project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        stage: { type: "string", description: "Filter by stage: idea/dev/beta/live/paused/archived" },
      },
    },
    handler: async (args: { stage?: string }) => {
      let query = db.select().from(projects);
      if (args.stage) query = query.where(eq(projects.stage, args.stage as any));
      const result = query.orderBy(desc(projects.updatedAt)).all();

      const issueCounts = db.select({
        projectId: issues.projectId,
        count: sql<number>`count(*)`,
      }).from(issues)
        .where(inArray(issues.status, ["open", "in-progress", "in-review"]))
        .groupBy(issues.projectId).all();

      const issueMap = new Map(issueCounts.map(r => [r.projectId, r.count]));

      return result.map(p => ({
        slug: p.slug,
        name: p.name,
        stage: p.stage,
        progress: `${p.progressPct}%`,
        phase: p.progressPhase,
        openIssues: issueMap.get(p.id) ?? 0,
        priority: p.priority,
      }));
    },
  },
  {
    name: "devforge_get_project",
    description: "Get full project details including open issues, recent notes, git status, and pending feedback. Use this when starting work on a project to load context.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Project slug (e.g. 'myagent'). Auto-detect from cwd if not provided." },
      },
      required: ["slug"],
    },
    handler: async (args: { slug: string }) => {
      const project = getProjectWithGit(args.slug);
      if (!project) return { error: `Project '${args.slug}' not found` };

      const openIssues = db.select().from(issues)
        .where(and(eq(issues.projectId, project.id), inArray(issues.status, ["open", "in-progress", "in-review"])))
        .orderBy(sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`)
        .all();

      const recentNotes = db.select().from(notes)
        .where(eq(notes.projectId, project.id))
        .orderBy(desc(notes.createdAt)).limit(5).all();

      const nextActionable = getNextActionableIssues(project.id, 3);
      const blocked = getBlockedIssues(project.id);

      return {
        project: {
          name: project.name,
          slug: project.slug,
          description: project.description,
          stage: project.stage,
          progress: `${project.progressPct}% — ${project.progressPhase}`,
          repoPath: project.repoPath,
          githubUrl: project.githubUrl,
        },
        git: project.git ? {
          branch: project.git.branch,
          lastCommit: `${project.git.lastCommitMsg} (${project.git.lastCommitDate})`,
          dirty: project.git.isDirty,
        } : null,
        openIssues,
        nextActionable,
        blocked,
        recentNotes: recentNotes.map(n => ({ title: n.title, date: n.createdAt })),
      };
    },
  },
  {
    name: "devforge_add_issue",
    description: "Add an issue to a project. Use when discovering bugs, TODOs, or ideas during development.",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_slug: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        type: { type: "string", enum: ["bug", "feature", "improvement", "question", "task", "note"] },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        depends_on: { type: "array", items: { type: "number" } },
      },
      required: ["project_slug", "title"],
    },
    handler: async (args: any) => {
      const project = db.select().from(projects).where(eq(projects.slug, args.project_slug)).get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db.insert(issues).values({
        projectId: project.id,
        title: args.title,
        description: args.description ?? "",
        type: args.type ?? "task",
        priority: args.priority ?? "medium",
        source: "auto",
        dependsOn: args.depends_on ?? [],
      }).returning().get();

      return { success: true, issue: { id: result.id, title: result.title } };
    },
  },
  {
    name: "devforge_update_issue",
    description: "Update an issue's status, priority, or description.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "number" },
        status: { type: "string", enum: ["open", "in-review", "in-progress", "resolved", "wont-fix", "deferred"] },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        description: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (args: any) => {
      const updates: any = { updatedAt: new Date().toISOString() };
      if (args.status) updates.status = args.status;
      if (args.priority) updates.priority = args.priority;
      if (args.description) updates.description = args.description;
      if (args.status === "resolved") updates.resolvedAt = new Date().toISOString();

      const result = db.update(issues).set(updates).where(eq(issues.id, args.id)).returning().get();
      return result ? { success: true, issue: result } : { error: "Issue not found" };
    },
  },
  {
    name: "devforge_add_note",
    description: "Add a markdown note to a project. Use for recording design decisions, discoveries, or session summaries.",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string", description: "Markdown content" },
        source: { type: "string", enum: ["manual", "auto", "session-summary"] },
      },
      required: ["project_slug", "title", "content"],
    },
    handler: async (args: any) => {
      const project = db.select().from(projects).where(eq(projects.slug, args.project_slug)).get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db.insert(notes).values({
        projectId: project.id,
        title: args.title,
        content: args.content,
        source: args.source ?? "auto",
      }).returning().get();

      return { success: true, note: { id: result.id, title: result.title } };
    },
  },
  {
    name: "devforge_update_progress",
    description: "Update a project's progress percentage, phase label, or stage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_slug: { type: "string" },
        progress_pct: { type: "number", description: "0-100" },
        progress_phase: { type: "string", description: "e.g. 'Phase 3/5'" },
        stage: { type: "string", enum: ["idea", "dev", "beta", "live", "paused", "archived"] },
      },
      required: ["project_slug"],
    },
    handler: async (args: any) => {
      const updates: any = { updatedAt: new Date().toISOString() };
      if (args.progress_pct !== undefined) updates.progressPct = args.progress_pct;
      if (args.progress_phase) updates.progressPhase = args.progress_phase;
      if (args.stage) updates.stage = args.stage;

      const result = db.update(projects).set(updates)
        .where(eq(projects.slug, args.project_slug)).returning().get();
      return result ? { success: true } : { error: "Project not found" };
    },
  },
  {
    name: "devforge_get_feedback",
    description: "Get unread/open feedback for a project from external users.",
    inputSchema: {
      type: "object" as const,
      properties: {
        project_slug: { type: "string" },
      },
      required: ["project_slug"],
    },
    handler: async (args: any) => {
      // Feedback table is in Plan 3. Return empty for now.
      return { feedback: [], message: "Feedback system not yet deployed (Plan 3)" };
    },
  },
  {
    name: "devforge_scan",
    description: "Trigger a git repo scan to discover and update projects.",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const result = await seedFromScan();
      return result;
    },
  },
];
```

- [ ] **Step 3: Write MCP server entry**

`mcp-server/index.ts`:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS } from "./tools";

const server = new McpServer({
  name: "devforge",
  version: "1.0.0",
});

// Register all tools
for (const tool of TOOLS) {
  server.tool(tool.name, tool.description, tool.inputSchema, async (args: any) => {
    try {
      const result = await tool.handler(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: JSON.stringify({ error: error.message }) }] };
    }
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 4: Test MCP server**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx tsx mcp-server/index.ts
# Should return list of 8 tools
```

- [ ] **Step 5: Commit**

```bash
git add mcp-server/
git commit -m "feat: MCP Server with 8 tools — projects, issues, notes, progress, feedback, scan"
```

---

### Task 2: Register MCP Server in Claude Code settings

**Files:**
- Create: `scripts/register-mcp.sh`

- [ ] **Step 1: Write registration script**

`scripts/register-mcp.sh`:
```bash
#!/bin/bash
# Register DevForge MCP server in Claude Code settings
SETTINGS="$HOME/.claude/settings.json"
DEVFORGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MCP_CMD="npx tsx ${DEVFORGE_DIR}/mcp-server/index.ts"

if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

# Use node to safely merge JSON
node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$SETTINGS', 'utf8'));
if (!settings.mcpServers) settings.mcpServers = {};
settings.mcpServers.devforge = {
  command: 'npx',
  args: ['tsx', '${DEVFORGE_DIR}/mcp-server/index.ts']
};
fs.writeFileSync('$SETTINGS', JSON.stringify(settings, null, 2));
console.log('✓ Registered DevForge MCP server');
"
```

- [ ] **Step 2: Make executable and run**

```bash
chmod +x scripts/register-mcp.sh
./scripts/register-mcp.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: MCP server registration script"
```

---

## Chunk 2: Claude Plugin

### Task 3: Plugin manifest

**Files:**
- Create: `.claude-plugin/manifest.json`

- [ ] **Step 1: Write manifest**

`.claude-plugin/manifest.json`:
```json
{
  "name": "devforge",
  "version": "1.0.0",
  "description": "Personal Project Command Center — manage all your side projects from Claude Code",
  "author": "xmqywx",
  "commands": [
    { "name": "init", "description": "Initialize DevForge: create DB, register MCP, scan git repos" },
    { "name": "status", "description": "Show project status (all or current)" },
    { "name": "issues", "description": "List open issues for current project" },
    { "name": "add-issue", "description": "Add an issue to current project" },
    { "name": "note", "description": "Add a note to current project" },
    { "name": "summary", "description": "Generate session summary and update project" },
    { "name": "progress", "description": "Update project progress/stage" },
    { "name": "configure", "description": "Configure automation settings" },
    { "name": "open", "description": "Open DevForge Dashboard in browser" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/
git commit -m "feat: Claude plugin manifest"
```

---

### Task 4: Slash command prompt files

**Files:**
- Create: `commands/init.md`
- Create: `commands/status.md`
- Create: `commands/issues.md`
- Create: `commands/add-issue.md`
- Create: `commands/note.md`
- Create: `commands/summary.md`
- Create: `commands/progress.md`
- Create: `commands/configure.md`
- Create: `commands/open.md`

- [ ] **Step 1: Write /devforge:init**

`commands/init.md`:
```markdown
---
name: init
description: Initialize DevForge — create DB, register MCP, scan git repos, detect current project
---

## DevForge Init

Run these steps in order:

### Step 1: Check if DB exists
```bash
ls -la ~/.devforge/devforge.db 2>/dev/null
```
If not found, create it:
```bash
cd <DEVFORGE_INSTALL_DIR> && npx drizzle-kit push
```

### Step 2: Register MCP Server
Check if devforge is already in `~/.claude/settings.json` mcpServers.
If not, run:
```bash
cd <DEVFORGE_INSTALL_DIR> && ./scripts/register-mcp.sh
```
Tell user to restart Claude Code for MCP to take effect.

### Step 3: Detect current project
Check current working directory for `.git`:
```bash
git remote get-url origin 2>/dev/null
basename $(pwd)
```
Use the MCP tool `devforge_list_projects` to check if this repo is already registered.
- If found: load project context with `devforge_get_project`
- If not found: ask user if they want to register it as a new project

### Step 4: Scan (first time only)
If DB has 0 projects, trigger a full scan:
Use MCP tool `devforge_scan`

### Step 5: Report
Display:
- Number of projects found
- Current project context (if detected)
- Open issues for current project
- "DevForge is ready! Use /devforge:status or ask me about your projects."
```

- [ ] **Step 2: Write /devforge:status**

`commands/status.md`:
```markdown
---
name: status
description: Show project status — all projects overview or single project detail
---

## DevForge Status

If user specifies a project name, use `devforge_get_project` MCP tool with that slug.
If no project specified, try to detect from current directory. If still none, use `devforge_list_projects`.

### Single project output format (CCPM standup style):
```
📊 DevForge Status — {project_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔨 In Progress ({count})
  • #{id} {title} [{priority}]

✅ Recently Completed (24h)
  • #{id} {title}

⏭️ Next Actionable ({count})
  • #{id} {title} [{priority}] — deps cleared

🚫 Blocked ({count})
  • #{id} {title} — blocked by #{blocking_id}

💬 New Feedback ({count})
  • "{title}" — {author}, {upvotes} upvotes

Progress: {phase} {progress_bar} {pct}%
```

### All projects output format:
Table with columns: Project | Stage | Progress | Issues | Last Commit
```

- [ ] **Step 3: Write /devforge:issues**

`commands/issues.md`:
```markdown
---
name: issues
description: List open issues for current project, sorted by priority
---

## DevForge Issues

1. Detect current project from working directory
2. Use `devforge_get_project` to get open issues
3. Display issues sorted by priority (high → medium → low)
4. Show source label: [manual] [auto] [feedback]
5. Show dependency info if any issue is blocked
```

- [ ] **Step 4: Write /devforge:add-issue**

`commands/add-issue.md`:
```markdown
---
name: add-issue
description: Add an issue to current project
---

## DevForge Add Issue

1. Detect current project from working directory
2. Ask user for:
   - Title (required)
   - Type: bug / feature / improvement / task (default: task)
   - Priority: high / medium / low (default: medium)
   - Description (optional, markdown)
3. Use MCP tool `devforge_add_issue` to create
4. Confirm: "✅ Issue #{id} created: {title}"
```

- [ ] **Step 5: Write /devforge:note**

`commands/note.md`:
```markdown
---
name: note
description: Add a markdown note to current project
---

## DevForge Note

1. Detect current project
2. Ask user for:
   - Title (required)
   - Content (markdown, can be multi-line)
3. Use MCP tool `devforge_add_note`
4. Confirm: "📝 Note added: {title}"
```

- [ ] **Step 6: Write /devforge:summary**

`commands/summary.md`:
```markdown
---
name: summary
description: Generate session summary — what was done, issues resolved, new discoveries
---

## DevForge Session Summary

1. Detect current project
2. Analyze the current conversation to extract:
   - What was accomplished
   - Issues that were fixed (match against open issues by keyword)
   - New bugs/issues discovered
   - Design decisions made
   - Code changes committed
3. For each resolved issue: use `devforge_update_issue` to set status=resolved
4. For each new issue found: use `devforge_add_issue` to create
5. Write a session summary note via `devforge_add_note` with source=session-summary
6. Optionally update progress via `devforge_update_progress`
7. Output the summary in a formatted block
```

- [ ] **Step 7: Write /devforge:progress**

`commands/progress.md`:
```markdown
---
name: progress
description: Update project progress percentage, phase, or stage
---

## DevForge Progress

Parse user input:
- `/devforge:progress 60%` → update progress_pct to 60
- `/devforge:progress phase 3` → update progress_phase to "Phase 3/5"
- `/devforge:progress stage beta` → update stage to beta

Use MCP tool `devforge_update_progress`.
Confirm the update.
```

- [ ] **Step 8: Write /devforge:configure**

`commands/configure.md`:
```markdown
---
name: configure
description: Configure automation settings for current project
---

## DevForge Configure

1. Detect current project
2. Show current automation settings using AskUserQuestion:
   - Auto-record issues: ON / OFF / Default
   - Auto-record notes: ON / OFF / Default
   - Session summary on exit: ON / OFF / Default
   - Auto-load context: ON / OFF / Default
   - Auto-update progress: ON / OFF / Default
3. Update project via API: PATCH /api/projects/{slug}
4. Confirm changes
```

- [ ] **Step 9: Write /devforge:open**

`commands/open.md`:
```markdown
---
name: open
description: Open DevForge Dashboard in browser
---

## DevForge Open

1. Check if web server is running:
```bash
curl -s http://localhost:3456 > /dev/null 2>&1
```

2. If not running, start it:
```bash
cd <DEVFORGE_DIR>/web && npm run dev -- -p 3456 &
```

3. Open in browser:
```bash
open http://localhost:3456
```
```

- [ ] **Step 10: Commit**

```bash
git add commands/
git commit -m "feat: 9 slash command prompt files — init, status, issues, add-issue, note, summary, progress, configure, open"
```

---

## Chunk 3: CLI + Deterministic Scripts

### Task 5: CLI tool

**Files:**
- Create: `cli/index.ts`

- [ ] **Step 1: Install commander**

```bash
npm install commander
```

- [ ] **Step 2: Write CLI**

`cli/index.ts`:
```typescript
#!/usr/bin/env npx tsx
import { Command } from "commander";
import { db } from "../src/db/client";
import { projects, issues, gitSnapshots } from "../src/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getNextActionableIssues, getBlockedIssues, getOverviewStats } from "../src/lib/queries";
import { seedFromScan } from "../src/db/seed";

const program = new Command();

program.name("devforge").description("Personal Project Command Center").version("1.0.0");

program.command("status [project]")
  .description("Show project status")
  .action((projectSlug?: string) => {
    if (projectSlug) {
      const project = db.select().from(projects).where(eq(projects.slug, projectSlug)).get();
      if (!project) { console.error(`Project '${projectSlug}' not found`); process.exit(1); }

      const openIssues = db.select().from(issues)
        .where(inArray(issues.status, ["open", "in-progress", "in-review"]))
        .where(eq(issues.projectId, project.id)).all();

      const git = db.select().from(gitSnapshots)
        .where(eq(gitSnapshots.projectId, project.id))
        .orderBy(desc(gitSnapshots.scannedAt)).limit(1).get();

      console.log(`\n📊 ${project.name} — ${project.stage} — ${project.progressPct}%`);
      console.log(`   Branch: ${git?.branch ?? "—"} | Last: ${git?.lastCommitDate?.split("T")[0] ?? "—"}`);
      console.log(`   Open issues: ${openIssues.length}`);
      openIssues.forEach(i => console.log(`     • #${i.id} [${i.priority}] ${i.title}`));
    } else {
      const stats = getOverviewStats();
      const all = db.select().from(projects)
        .where(inArray(projects.stage, ["dev", "beta", "live", "idea"]))
        .orderBy(desc(projects.updatedAt)).all();

      console.log(`\n📊 DevForge — ${stats.totalProjects} projects, ${stats.openIssues} open issues\n`);
      all.forEach(p => {
        const bar = "█".repeat(Math.floor((p.progressPct ?? 0) / 10)) + "░".repeat(10 - Math.floor((p.progressPct ?? 0) / 10));
        console.log(`  ${p.icon ?? "📦"} ${p.name.padEnd(20)} ${(p.stage ?? "").padEnd(8)} ${bar} ${p.progressPct ?? 0}%`);
      });
    }
  });

program.command("issue")
  .description("Issue management")
  .command("add <project> <title>")
  .option("-p, --priority <priority>", "high/medium/low", "medium")
  .option("-t, --type <type>", "bug/feature/task", "task")
  .action((projectSlug: string, title: string, opts: any) => {
    const project = db.select().from(projects).where(eq(projects.slug, projectSlug)).get();
    if (!project) { console.error(`Project '${projectSlug}' not found`); process.exit(1); }

    const result = db.insert(issues).values({
      projectId: project.id,
      title,
      type: opts.type,
      priority: opts.priority,
      source: "manual",
    }).returning().get();

    console.log(`✅ Issue #${result.id} created: ${title}`);
  });

program.command("scan")
  .description("Scan git repos")
  .action(async () => {
    console.log("Scanning...");
    const result = await seedFromScan();
    console.log(`✅ ${result.total} repos scanned, ${result.created} new, ${result.updated} updated`);
  });

program.command("open")
  .description("Open Dashboard in browser")
  .action(() => {
    const { execSync } = require("child_process");
    execSync("open http://localhost:3456");
  });

program.parse();
```

- [ ] **Step 3: Add bin to package.json**

```json
{
  "bin": {
    "devforge": "./cli/index.ts"
  }
}
```

- [ ] **Step 4: Test CLI**

```bash
npx tsx cli/index.ts status
npx tsx cli/index.ts status myagent
npx tsx cli/index.ts issue add myagent "Test issue" -p high -t bug
```

- [ ] **Step 5: Commit**

```bash
git add cli/ package.json
git commit -m "feat: devforge CLI — status, issue add, scan, open"
```

---

### Task 6: Deterministic bash scripts (CCPM pattern)

**Files:**
- Create: `scripts/status.sh`
- Create: `scripts/next-issue.sh`
- Create: `scripts/blocked.sh`

- [ ] **Step 1: Write status script**

`scripts/status.sh`:
```bash
#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
if [ ! -f "$DB" ]; then echo "❌ DB not found. Run /devforge:init"; exit 1; fi

echo "📊 DevForge Status"
echo "━━━━━━━━━━━━━━━━━━"
echo ""
echo "Projects: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects")"
echo "  Active: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects WHERE stage IN ('dev','beta','live')")"
echo "  Paused: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects WHERE stage = 'paused'")"
echo ""
echo "Issues:"
echo "  Open: $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'open'")"
echo "  In Progress: $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'in-progress'")"
echo "  Resolved (7d): $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'resolved' AND resolved_at >= datetime('now','-7 days')")"
```

- [ ] **Step 2: Write next-issue script**

`scripts/next-issue.sh`:
```bash
#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
PROJECT_SLUG="${1:-}"

if [ -z "$PROJECT_SLUG" ]; then
  echo "Usage: next-issue.sh <project-slug>"
  exit 1
fi

PROJECT_ID=$(sqlite3 "$DB" "SELECT id FROM projects WHERE slug = '$PROJECT_SLUG'")
if [ -z "$PROJECT_ID" ]; then echo "❌ Project not found"; exit 1; fi

echo "⏭️ Next Actionable Issues — $PROJECT_SLUG"
echo ""
sqlite3 -header -column "$DB" "
  SELECT i.id, i.title, i.priority, i.type
  FROM issues i
  WHERE i.project_id = $PROJECT_ID
  AND i.status = 'open'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(i.depends_on) AS dep
    JOIN issues blocked ON blocked.id = dep.value
    WHERE blocked.status NOT IN ('resolved', 'wont-fix')
  )
  ORDER BY
    CASE i.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    i.created_at ASC
  LIMIT 5;
"
```

- [ ] **Step 3: Write blocked script**

`scripts/blocked.sh`:
```bash
#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
PROJECT_SLUG="${1:-}"

if [ -z "$PROJECT_SLUG" ]; then
  echo "Usage: blocked.sh <project-slug>"
  exit 1
fi

PROJECT_ID=$(sqlite3 "$DB" "SELECT id FROM projects WHERE slug = '$PROJECT_SLUG'")
if [ -z "$PROJECT_ID" ]; then echo "❌ Project not found"; exit 1; fi

echo "🚫 Blocked Issues — $PROJECT_SLUG"
echo ""
sqlite3 -header -column "$DB" "
  SELECT i.id, i.title, blocked.id as blocked_by, blocked.title as blocked_by_title
  FROM issues i, json_each(i.depends_on) AS dep
  JOIN issues blocked ON blocked.id = dep.value
  WHERE i.status = 'open'
  AND i.project_id = $PROJECT_ID
  AND blocked.status NOT IN ('resolved', 'wont-fix');
"
```

- [ ] **Step 4: Make executable**

```bash
chmod +x scripts/status.sh scripts/next-issue.sh scripts/blocked.sh
```

- [ ] **Step 5: Commit**

```bash
git add scripts/
git commit -m "feat: deterministic bash scripts — status, next-issue, blocked (CCPM pattern)"
```

---

### Task 7: Final verification and push

- [ ] **Step 1: Test full flow**

```bash
# MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx tsx mcp-server/index.ts

# CLI
npx tsx cli/index.ts status
npx tsx cli/index.ts status myagent

# Scripts
./scripts/status.sh
./scripts/next-issue.sh myagent

# Plugin manifest
cat .claude-plugin/manifest.json
```

- [ ] **Step 2: Push**

```bash
git push origin master
```
