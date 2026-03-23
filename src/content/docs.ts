export interface DocSection {
  slug: string;
  title: string;
  content: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    content: `
<h1>Getting Started</h1>

<h2>What is DevForge?</h2>
<p>DevForge is a comprehensive personal project command center that integrates with Claude Code via MCP Server and Plugin system. It tracks 90+ git repositories and provides project management, issue tracking, and community feedback.</p>

<h2>Dashboard vs Portal</h2>
<table>
  <thead><tr><th>Dashboard (localhost:3102)</th><th>Portal (forge.wdao.chat)</th></tr></thead>
  <tbody>
    <tr><td>Full read/write CRUD</td><td>Read-only display</td></tr>
    <tr><td>Manages 93+ projects</td><td>Shows 8 public projects</td></tr>
    <tr><td>Reply to feedback (Owner)</td><td>Submit feedback</td></tr>
    <tr><td>Create releases/milestones</td><td>View releases/milestones</td></tr>
    <tr><td>Edit issues</td><td>Vote/comment on issues</td></tr>
    <tr><td>Push/pull sync control</td><td>Passively receives data</td></tr>
    <tr><td>Local SQLite</td><td>Server SQLite</td></tr>
  </tbody>
</table>

<h2>Installation</h2>
<pre><code class="language-bash">curl -fsSL https://raw.githubusercontent.com/xmqywx/DevForge/master/install.sh | bash</code></pre>

<h2>Manual Setup</h2>
<pre><code class="language-bash">git clone https://github.com/xmqywx/DevForge.git
cd DevForge
npm install
npx drizzle-kit push
bash scripts/register-mcp.sh</code></pre>

<h2>First Use</h2>
<p>Run <code>/devforge:init</code> in Claude Code to initialize and detect your current project. DevForge will automatically scan your git repositories, load project context, and make all MCP tools available.</p>

<h2>Requirements</h2>
<ul>
  <li>Node.js 18+</li>
  <li>Claude Code (with MCP support)</li>
  <li>Git repositories in your home directory</li>
</ul>
    `,
  },
  {
    slug: "slash-commands",
    title: "Slash Commands",
    content: `
<h1>Slash Commands</h1>

<p>Slash commands are invoked inside Claude Code conversations. They trigger Claude to load context and perform actions using the DevForge plugin system.</p>

<h2>All 12 Commands</h2>

<table>
  <thead>
    <tr><th>Command</th><th>Description</th><th>Example Usage</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/devforge:init</code></td>
      <td>Initialize project — detects current directory, loads context, activates MCP tools</td>
      <td>Run at start of every session</td>
    </tr>
    <tr>
      <td><code>/devforge:df-status</code></td>
      <td>View project status — shows progress percentage, stage, open issues</td>
      <td>Quick health check on current project</td>
    </tr>
    <tr>
      <td><code>/devforge:df-issues</code></td>
      <td>List open issues — shows all open and in-progress issues for current project</td>
      <td>Before starting work to pick the next task</td>
    </tr>
    <tr>
      <td><code>/devforge:df-add-issue</code></td>
      <td>Add a new issue — creates bug, feature, or task with priority</td>
      <td>When you discover a bug mid-session</td>
    </tr>
    <tr>
      <td><code>/devforge:df-note</code></td>
      <td>Add a note — records design decisions, architecture notes, or observations</td>
      <td>After making an important design decision</td>
    </tr>
    <tr>
      <td><code>/devforge:df-summary</code></td>
      <td>Session summary — automatically analyzes conversation and records what was done</td>
      <td>At end of every work session</td>
    </tr>
    <tr>
      <td><code>/devforge:df-progress</code></td>
      <td>Update progress — sets completion percentage or changes project stage</td>
      <td>After completing a milestone or phase</td>
    </tr>
    <tr>
      <td><code>/devforge:df-configure</code></td>
      <td>Configure automation — toggle auto-record issues, notes, session summaries</td>
      <td>To customize DevForge behavior for a project</td>
    </tr>
    <tr>
      <td><code>/devforge:df-release</code></td>
      <td>Create a release — auto-generates changelog from recent git commits</td>
      <td>When shipping a new version</td>
    </tr>
    <tr>
      <td><code>/devforge:df-sync</code></td>
      <td>Sync data — push local data to server or pull feedback from users</td>
      <td>After making changes you want on the portal</td>
    </tr>
    <tr>
      <td><code>/devforge:df-scan</code></td>
      <td>Scan git repos — re-scans configured paths to find new repositories</td>
      <td>After creating a new project</td>
    </tr>
    <tr>
      <td><code>/devforge:open</code></td>
      <td>Open Dashboard — opens localhost:3102 in browser</td>
      <td>To view the Dashboard UI</td>
    </tr>
  </tbody>
</table>

<h2>Usage Tips</h2>
<ul>
  <li>Always start sessions with <code>/devforge:init</code> to load context</li>
  <li>Commands are case-sensitive — use exact names as shown</li>
  <li>If a command doesn't appear in suggestions, type the full name directly</li>
  <li>Some command names may conflict with built-in Claude commands — use full name to override</li>
</ul>

<h2>Auto-Record Rule</h2>
<p>Per <code>CLAUDE.md</code>, Claude should proactively call MCP tools without being asked:</p>
<ul>
  <li>Discovers a bug → <code>devforge_add_issue</code> immediately</li>
  <li>User reports a problem → <code>devforge_add_issue</code> immediately</li>
  <li>Fixes an issue → <code>devforge_update_issue</code> to mark resolved</li>
  <li>Makes a design decision → <code>devforge_add_note</code></li>
  <li>End of session → summarize via <code>devforge_add_note</code></li>
</ul>
    `,
  },
  {
    slug: "mcp-tools",
    title: "MCP Tools",
    content: `
<h1>MCP Tools</h1>

<p>MCP (Model Context Protocol) tools are called directly by Claude Code. They interact with the local SQLite database and the server API.</p>

<h2>Tool Reference</h2>

<table>
  <thead>
    <tr><th>Tool</th><th>Description</th><th>Key Parameters</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>devforge_list_projects</code></td>
      <td>List all projects, optionally filtered by stage</td>
      <td><code>stage?</code> (idea/active/shipped/archived)</td>
    </tr>
    <tr>
      <td><code>devforge_get_project</code></td>
      <td>Get full project details including issues, notes, releases</td>
      <td><code>slug</code> (required)</td>
    </tr>
    <tr>
      <td><code>devforge_add_issue</code></td>
      <td>Create a new issue for a project</td>
      <td><code>project_slug</code>, <code>title</code>, <code>type?</code>, <code>priority?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_issue</code></td>
      <td>Update issue status, priority, or other fields</td>
      <td><code>id</code>, <code>status?</code>, <code>priority?</code>, <code>title?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_note</code></td>
      <td>Add a note (design decision, observation, session summary)</td>
      <td><code>project_slug</code>, <code>title</code>, <code>content</code>, <code>type?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_progress</code></td>
      <td>Update a project's progress percentage or stage</td>
      <td><code>project_slug</code>, <code>progress_pct?</code>, <code>stage?</code>, <code>stage_text?</code></td>
    </tr>
    <tr>
      <td><code>devforge_get_feedback</code></td>
      <td>Fetch feedback entries, optionally filtered by project</td>
      <td><code>project_slug?</code>, <code>status?</code></td>
    </tr>
    <tr>
      <td><code>devforge_scan</code></td>
      <td>Scan directories for git repositories and update project list</td>
      <td><code>paths?</code> (array of directory paths to scan)</td>
    </tr>
    <tr>
      <td><code>devforge_add_release</code></td>
      <td>Create a new release with version number and changelog</td>
      <td><code>project_slug</code>, <code>version</code>, <code>title</code>, <code>content</code>, <code>date?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_milestone</code></td>
      <td>Add a project milestone with date and status</td>
      <td><code>project_slug</code>, <code>title</code>, <code>status</code>, <code>date</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_readme</code></td>
      <td>Update a project's README content</td>
      <td><code>project_slug</code>, <code>content?</code> (auto-reads from file if omitted)</td>
    </tr>
    <tr>
      <td><code>devforge_sync</code></td>
      <td>Synchronize data between local DB and server</td>
      <td><code>direction?</code> (push/pull/both, default: both)</td>
    </tr>
  </tbody>
</table>

<h2>Tool Loading</h2>
<p>If MCP tools are not appearing, call <code>ToolSearch("devforge")</code> to load them. This is a known quirk of the MCP system — tools must be fetched before first use in a new conversation.</p>

<pre><code class="language-text">// In Claude Code, if tools are missing:
ToolSearch("devforge")
// Then use the tools normally</code></pre>

<h2>Issue Types</h2>
<ul>
  <li><code>bug</code> — something is broken</li>
  <li><code>feature</code> — new functionality</li>
  <li><code>task</code> — work item or chore</li>
  <li><code>improvement</code> — enhancement to existing feature</li>
</ul>

<h2>Issue Priorities</h2>
<ul>
  <li><code>critical</code> — blocks everything, fix immediately</li>
  <li><code>high</code> — important, do soon</li>
  <li><code>medium</code> — normal priority (default)</li>
  <li><code>low</code> — nice to have</li>
</ul>

<h2>Issue Statuses</h2>
<ul>
  <li><code>open</code> — not started</li>
  <li><code>in-progress</code> — actively being worked on</li>
  <li><code>in-review</code> — code written, under review</li>
  <li><code>done</code> — completed</li>
  <li><code>closed</code> — won't fix or duplicate</li>
</ul>
    `,
  },
  {
    slug: "cli-commands",
    title: "CLI Commands",
    content: `
<h1>CLI Commands</h1>

<p>The <code>devforge</code> CLI provides terminal access to DevForge functionality. Useful for scripting, quick operations without opening Claude Code, or automation.</p>

<h2>Installation</h2>
<p>The CLI is installed automatically by the install script. After installation, the <code>devforge</code> command is available globally.</p>

<pre><code class="language-bash"># Verify installation
devforge --version

# Get help
devforge --help</code></pre>

<h2>Commands</h2>

<h3>status</h3>
<pre><code class="language-bash">devforge status [project-slug]

# Examples:
devforge status                  # Global overview
devforge status my-agent         # Status for specific project</code></pre>
<p>Shows project progress, stage, open issue count, and last activity.</p>

<h3>issue</h3>
<pre><code class="language-bash">devforge issue add &lt;project&gt; &lt;title&gt; [options]
devforge issue list [project]
devforge issue close &lt;id&gt;

# Options for add:
#   -p, --priority &lt;level&gt;    critical|high|medium|low
#   -t, --type &lt;type&gt;         bug|feature|task|improvement
#   -d, --description &lt;text&gt;  Issue description

# Examples:
devforge issue add my-app "Fix login bug" -p high -t bug
devforge issue list my-app
devforge issue close 42</code></pre>

<h3>scan</h3>
<pre><code class="language-bash">devforge scan [paths...]

# Examples:
devforge scan                           # Scan default configured paths
devforge scan ~/Documents ~/Projects   # Scan specific directories</code></pre>
<p>Scans directories for git repositories and updates the project database.</p>

<h3>sync</h3>
<pre><code class="language-bash">devforge sync [direction]

# Directions: push | pull | both (default: both)

# Examples:
devforge sync           # Bidirectional sync
devforge sync push      # Push local data to server
devforge sync pull      # Pull feedback from server</code></pre>

<h3>open</h3>
<pre><code class="language-bash">devforge open           # Opens localhost:3102 in default browser</code></pre>

<h2>Exit Codes</h2>
<ul>
  <li><code>0</code> — success</li>
  <li><code>1</code> — general error</li>
  <li><code>2</code> — not found (project, issue, etc.)</li>
  <li><code>3</code> — network error (sync failed)</li>
</ul>
    `,
  },
  {
    slug: "bash-scripts",
    title: "Bash Scripts",
    content: `
<h1>Bash Scripts</h1>

<p>The <code>scripts/</code> directory contains utility scripts for common operations. These are lower-level alternatives to the CLI commands.</p>

<h2>scripts/status.sh</h2>
<pre><code class="language-bash">bash scripts/status.sh [project-slug]</code></pre>
<p>Prints a summary of all projects or a specific project — stage, progress, open issues, last commit date.</p>

<h2>scripts/next-issue.sh</h2>
<pre><code class="language-bash">bash scripts/next-issue.sh &lt;project-slug&gt;

# Example:
bash scripts/next-issue.sh my-agent</code></pre>
<p>Returns the highest-priority open issue that has no blocking dependencies. Useful for quickly deciding what to work on next.</p>

<h2>scripts/blocked.sh</h2>
<pre><code class="language-bash">bash scripts/blocked.sh &lt;project-slug&gt;

# Example:
bash scripts/blocked.sh devforge</code></pre>
<p>Lists all issues that are blocked (have unresolved dependencies). Shows the blocking issue chain so you can resolve blockers first.</p>

<h2>scripts/sync.ts</h2>
<pre><code class="language-bash">npx tsx scripts/sync.ts [push|pull|both]

# Examples:
npx tsx scripts/sync.ts push   # Push to server
npx tsx scripts/sync.ts pull   # Pull feedback
npx tsx scripts/sync.ts both   # Full bidirectional sync (default)</code></pre>
<p>TypeScript sync script. Handles push (projects, issues, notes, releases, milestones → server) and pull (feedback, votes, comments → local).</p>

<h2>scripts/register-mcp.sh</h2>
<pre><code class="language-bash">bash scripts/register-mcp.sh</code></pre>
<p>Registers the DevForge MCP server in <code>~/.claude.json</code>. Run this after initial installation or if MCP tools stop appearing.</p>

<h2>Usage in CI / Automation</h2>
<pre><code class="language-bash"># Example: automated sync after deploy
npm run build
pm2 restart devforge-portal
npx tsx scripts/sync.ts push</code></pre>
    `,
  },
  {
    slug: "sync-mechanism",
    title: "Sync Mechanism",
    content: `
<h1>Sync Mechanism</h1>

<p>DevForge uses a unidirectional sync model to keep the local Dashboard and remote Portal in sync.</p>

<h2>Architecture</h2>

<pre><code class="language-text">Dashboard (local SQLite)        Portal (server SQLite)
        │                               │
        │ ──── PUSH ────────────────→  │
        │  projects, issues, notes      │
        │  releases, milestones         │
        │                               │
        │ ←─── PULL ─────────────────  │
        │  feedback, replies            │
        │  votes, comments              │
        │                               </code></pre>

<h2>Push (local → server)</h2>
<p>Push sends your local data to the Portal server. Only <em>public</em> projects are synced to the portal.</p>
<ul>
  <li><strong>Projects</strong> — only where <code>is_public = true</code></li>
  <li><strong>Issues</strong> — all issues for public projects</li>
  <li><strong>Notes</strong> — all notes for public projects</li>
  <li><strong>Releases</strong> — all releases for public projects</li>
  <li><strong>Milestones</strong> — all milestones for public projects</li>
</ul>

<pre><code class="language-bash"># Manual push
devforge sync push
# or
npx tsx scripts/sync.ts push</code></pre>

<h2>Pull (server → local)</h2>
<p>Pull fetches user-generated content from the Portal server.</p>
<ul>
  <li><strong>Feedback</strong> — user submissions from the Portal</li>
  <li><strong>Replies</strong> — comments on feedback threads</li>
  <li><strong>Votes</strong> — upvotes on feedback and issues</li>
</ul>

<pre><code class="language-bash"># Manual pull
devforge sync pull
# or
npx tsx scripts/sync.ts pull</code></pre>

<h2>Auto-Sync</h2>
<p>Auto-sync is triggered automatically in two cases:</p>
<ol>
  <li><strong>After every MCP write operation</strong> — any call to <code>devforge_add_issue</code>, <code>devforge_add_note</code>, <code>devforge_update_issue</code>, etc. automatically triggers a push</li>
  <li><strong>When Feedback page opens</strong> — the Feedback page auto-pulls on load and polls every 60 seconds</li>
</ol>

<h2>Sync API Endpoints</h2>
<pre><code class="language-text">POST https://forge.wdao.chat/api/sync/push
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Body: { projects, issues, notes, releases, milestones }

GET  https://forge.wdao.chat/api/sync/pull
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Returns: { feedback, replies, votes }</code></pre>

<h2>Configuration</h2>
<p>In <code>.env.local</code>:</p>
<pre><code class="language-bash">DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_SYNC_SECRET=your-sync-secret
DEVFORGE_OWNER_SECRET=devforge-owner-2026</code></pre>

<h2>Conflict Resolution</h2>
<p>DevForge uses a <em>last-write-wins</em> strategy. The server is treated as the source of truth for feedback/votes, and local is the source of truth for project data.</p>
    `,
  },
  {
    slug: "deploy-guide",
    title: "Deploy Guide",
    content: `
<h1>Deploy Guide</h1>

<p>The Portal (<code>forge.wdao.chat</code>) is deployed on a Linux VPS using rsync + PM2. There is no GitHub Actions pipeline — deployment is manual via SSH.</p>

<h2>Deployment Steps</h2>

<h3>Step 1: rsync source code to server</h3>
<pre><code class="language-bash">rsync -avz \\
  --exclude node_modules \\
  --exclude .next \\
  --exclude .git \\
  --exclude .env.local \\
  --exclude devforge.db \\
  -e ssh \\
  . root@106.54.19.137:/opt/devforge-portal/</code></pre>

<h3>Step 2: Build and restart on server</h3>
<pre><code class="language-bash">ssh root@106.54.19.137 "cd /opt/devforge-portal && npm install && rm -rf .next && npm run build && pm2 restart devforge-portal"</code></pre>

<h3>Step 3: Sync data</h3>
<pre><code class="language-bash">npx tsx scripts/sync.ts push</code></pre>

<h2>Full Deploy Script</h2>
<pre><code class="language-bash">#!/bin/bash
# deploy.sh — deploy Portal to production

set -e

echo "=== Deploying DevForge Portal ==="

# 1. rsync source
echo "→ Syncing files..."
rsync -avz \\
  --exclude node_modules \\
  --exclude .next \\
  --exclude .git \\
  --exclude .env.local \\
  --exclude devforge.db \\
  -e ssh \\
  . root@106.54.19.137:/opt/devforge-portal/

# 2. Build on server
echo "→ Building on server..."
ssh root@106.54.19.137 "
  cd /opt/devforge-portal
  npm install
  rm -rf .next
  npm run build
  pm2 restart devforge-portal
"

# 3. Push data sync
echo "→ Syncing data..."
npx tsx scripts/sync.ts push

echo "=== Deploy complete ==="
echo "Portal: https://forge.wdao.chat"</code></pre>

<h2>Server Structure</h2>
<pre><code class="language-text">/opt/devforge-portal/
├── src/
├── .next/          (built output)
├── .env.local      (server env vars)
├── devforge.db     (server SQLite)
└── package.json

/data/devforge/
└── uploads/        (user-uploaded images, served via Nginx)</code></pre>

<h2>PM2 Commands</h2>
<pre><code class="language-bash">pm2 list                        # View running processes
pm2 status devforge-portal      # Check portal status
pm2 logs devforge-portal        # View logs
pm2 restart devforge-portal     # Restart after changes
pm2 stop devforge-portal        # Stop the portal</code></pre>

<h2>Nginx Configuration</h2>
<p>The Portal runs on port 3000 internally. Nginx proxies port 80/443 to it and serves static files from <code>/data/devforge/uploads/</code>.</p>

<h2>Environment Variables (Server)</h2>
<pre><code class="language-bash">NODE_ENV=production
PORT=3000
DATABASE_URL=file:/opt/devforge-portal/devforge.db
DEVFORGE_SYNC_SECRET=your-sync-secret
DEVFORGE_OWNER_SECRET=devforge-owner-2026
UPLOAD_DIR=/data/devforge/uploads</code></pre>
    `,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    content: `
<h1>Troubleshooting</h1>

<h2>MCP Tools Not Found</h2>
<p><strong>Symptom:</strong> Claude says it can't find <code>devforge_*</code> tools or they don't appear.</p>
<p><strong>Fix:</strong></p>
<ol>
  <li>In Claude Code, call <code>ToolSearch("devforge")</code> to load the tools</li>
  <li>If still missing, run <code>bash scripts/register-mcp.sh</code> to re-register</li>
  <li>Restart Claude Code and run <code>/devforge:init</code> again</li>
</ol>
<pre><code class="language-bash">bash scripts/register-mcp.sh
# Then restart Claude Code</code></pre>

<h2>Images Not Displaying</h2>
<p><strong>Symptom:</strong> Feedback images show broken image icons.</p>
<p><strong>Fix:</strong> Dashboard needs to prefix relative image URLs with the server domain:</p>
<pre><code class="language-text">Wrong:   /uploads/image.png
Correct: https://forge.wdao.chat/uploads/image.png</code></pre>
<p>Check <code>DEVFORGE_SERVER_URL</code> in <code>.env.local</code> and ensure it uses <code>https://</code>.</p>
<p>On the server, verify uploads directory permissions:</p>
<pre><code class="language-bash">ssh root@106.54.19.137 "ls -la /data/devforge/uploads/"
# Should be readable by nginx user</code></pre>

<h2>Sync Failing</h2>
<p><strong>Symptom:</strong> Push/pull returns error or times out.</p>
<p><strong>Checklist:</strong></p>
<ol>
  <li>Verify <code>DEVFORGE_SERVER_URL</code> uses <code>https://</code> (not http)</li>
  <li>Check sync secret matches server configuration</li>
  <li>Test server connectivity: <code>curl https://forge.wdao.chat/api/sync/status</code></li>
  <li>Check PM2 logs on server: <code>ssh root@106.54.19.137 "pm2 logs devforge-portal --lines 50"</code></li>
</ol>

<h2>Plugin Commands Not Showing</h2>
<p><strong>Symptom:</strong> Slash commands like <code>/devforge:init</code> don't appear in suggestions.</p>
<p><strong>Fix:</strong></p>
<ul>
  <li>Some command names conflict with built-in Claude commands</li>
  <li>Type the full command name directly and press Enter — it will work even without autocomplete</li>
  <li>Check plugin installation: <code>ls ~/.claude/plugins/cache/devforge/</code></li>
</ul>

<h2>Hydration Error (Next.js)</h2>
<p><strong>Symptom:</strong> Console shows hydration mismatch errors, page renders incorrectly.</p>
<p><strong>Fix:</strong> Clear the Next.js cache:</p>
<pre><code class="language-bash">rm -rf .next
npm run dev</code></pre>

<h2>Database Errors</h2>
<p><strong>Symptom:</strong> SQL errors, missing tables, or corrupt data.</p>
<pre><code class="language-bash"># Re-run migrations
npx drizzle-kit push

# Check database
sqlite3 ~/.devforge/devforge.db ".tables"

# Backup and reset (last resort)
cp ~/.devforge/devforge.db ~/.devforge/devforge.db.bak
npx drizzle-kit push --force</code></pre>

<h2>Port 3102 Already in Use</h2>
<pre><code class="language-bash">lsof -i :3102
kill -9 &lt;PID&gt;
npm run dev</code></pre>

<h2>MCP Server Start Failure</h2>
<pre><code class="language-bash"># Test MCP server manually
bash mcp-server/start.sh

# Check for syntax errors
node mcp-server/index.js

# Re-register
bash scripts/register-mcp.sh</code></pre>

<h2>Getting Help</h2>
<p>Check the logs in the Sync page (<a href="/sync">Dashboard → Sync</a>) for recent sync errors. The sync log shows timestamps and error messages for the last 20 operations.</p>
    `,
  },
  {
    slug: "faq",
    title: "FAQ",
    content: `
<h1>Frequently Asked Questions</h1>

<h2>General</h2>

<h3>Q: Does Dashboard and Portal share the same database?</h3>
<p><strong>A:</strong> No. Dashboard uses a local SQLite file (<code>~/.devforge/devforge.db</code>), and Portal uses a server-side SQLite file (<code>/opt/devforge-portal/devforge.db</code>). They stay in sync via the push/pull API.</p>

<h3>Q: Where are uploaded images stored?</h3>
<p><strong>A:</strong> On the server at <code>/data/devforge/uploads/</code>, served by Nginx as static files. Dashboard image uploads also go to the server (not local disk) so Portal can display them.</p>

<h3>Q: How do I add a new project to the Portal?</h3>
<p><strong>A:</strong> In Dashboard, go to Projects, open the project, set <code>is_public = true</code>, save, then push sync. The project will appear on forge.wdao.chat.</p>

<h3>Q: Can I use DevForge without the Portal?</h3>
<p><strong>A:</strong> Yes. Dashboard and MCP tools work entirely locally. The Portal is optional — sync features just won't work without a server.</p>

<h2>MCP &amp; Integration</h2>

<h3>Q: Why do I need to run /devforge:init at the start of every session?</h3>
<p><strong>A:</strong> Claude Code doesn't persist tool state between conversations. <code>/devforge:init</code> loads the project context for the current directory and activates the MCP tools for that session.</p>

<h3>Q: Can Claude use DevForge tools without me asking?</h3>
<p><strong>A:</strong> Yes, and it should. Per <code>CLAUDE.md</code>, Claude is configured to proactively record bugs, decisions, and session summaries without being prompted. This is the intended workflow.</p>

<h3>Q: How many repositories can DevForge track?</h3>
<p><strong>A:</strong> Unlimited locally. The dashboard currently tracks 93+ repos. Performance remains good because the local SQLite database handles it efficiently. The Portal only shows public projects.</p>

<h2>Data &amp; Sync</h2>

<h3>Q: What happens if I delete a project locally and push?</h3>
<p><strong>A:</strong> The push API will remove the project from the server. All associated issues, notes, and feedback linked to that project will also be removed from the server.</p>

<h3>Q: How often does auto-sync run?</h3>
<p><strong>A:</strong> Auto-push runs after every MCP write operation (no delay). Auto-pull runs when you open the Feedback page and every 60 seconds while it's open. There's no background polling for push.</p>

<h3>Q: Is sync secure?</h3>
<p><strong>A:</strong> Sync uses a shared secret in the request header (<code>x-sync-secret</code>). Owner replies use a separate <code>x-owner-secret</code>. These are environment variables — never commit them to git.</p>

<h2>Development</h2>

<h3>Q: How do I run both Dashboard and Portal locally?</h3>
<pre><code class="language-bash"># Dashboard (this app)
npm run dev          # runs on :3102

# Portal (separate repo)
cd ~/Documents/DevForge  # Portal code
npm run dev              # runs on :3000</code></pre>

<h3>Q: Can I contribute to DevForge?</h3>
<p><strong>A:</strong> DevForge is a personal tool but the code is open source. Feel free to fork it and adapt it for your own projects.</p>

<h3>Q: What's the difference between a Note and an Issue?</h3>
<p><strong>A:</strong> Issues are actionable work items with status tracking (open/in-progress/done). Notes are free-form records of decisions, observations, or session summaries — they don't have a status or priority.</p>
    `,
  },
];

export function getDocSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.slug === slug);
}

export function getFirstSection(): DocSection {
  return DOC_SECTIONS[0];
}
