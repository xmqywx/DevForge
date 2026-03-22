# DevForge — Personal Project Command Center

## Overview

DevForge 是一个个人项目管理控制台，以 **Claude Code Plugin + MCP Server + Web Dashboard** 三合一架构，帮助独立开发者管理多个项目的状态、进度、Issues，并提供公开反馈收集能力。

### 核心定位

- **不是** 通用项目管理工具（Jira/Linear/Plane 已经做了）
- **是** 独立开发者的"项目帝国控制台"——多项目全局视角 + Claude Code 原生集成 + 公开反馈
- 借鉴 CCPM 的 Script-First 原则和 Frontmatter Schema，但定位完全不同：CCPM 管单项目开发流程，DevForge 管多项目生命周期

### 目标用户

独立开发者 / Side Project 创业者，同时维护多个个人项目，需要：
1. 一眼看到所有项目状态
2. Claude Code 新会话自动知道项目上下文
3. 外部用户能提反馈和建议

---

## Tech Stack

| 层 | 技术 |
|----|------|
| **Frontend** | Next.js 15 (App Router) + TailwindCSS 4 + shadcn/ui + Motion + ReactBits |
| **Database** | SQLite (本地, via better-sqlite3) / PostgreSQL (服务器, via pg) — Drizzle ORM 抽象 |
| **Plugin** | Claude Code Plugin 标准 (.claude-plugin/) |
| **MCP** | MCP Server (TypeScript, @modelcontextprotocol/sdk) |
| **CLI** | devforge CLI (TypeScript, commander.js) |
| **Scanner** | Git repo scanner (simple-git) |
| **Email** | Nodemailer (反馈通知) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Claude Code Plugin                        │
│  /devforge:init, :status, :issues, :add-issue,      │
│  :note, :summary, :progress, :configure, :open      │
├─────────────────────────────────────────────────────┤
│  Layer 2: MCP Server                                │
│  8 tools: list_projects, get_project, add_issue,    │
│  update_issue, add_note, update_progress,           │
│  get_feedback, scan                                 │
├─────────────────────────────────────────────────────┤
│  Layer 3: Web Dashboard (Next.js)                   │
│  Private: Overview, Projects, Issues, Timeline,     │
│           Feedback, Settings                        │
│  Public:  /, /projects/:slug, /feedback,            │
│           /feedback/new, /roadmap                   │
├─────────────────────────────────────────────────────┤
│  Shared: SQLite/PostgreSQL (Drizzle ORM)            │
│  ~/.devforge/devforge.db                            │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
Git Repos (~/Documents/**)
  │ scanner/git-scan.ts (auto-detect .git dirs)
  ▼
SQLite DB (~/.devforge/devforge.db)
  │ projects, issues, notes, feedback, git_snapshots
  ▼
API Routes (Next.js /api/*)
  │ CRUD for all entities
  ▼
Three entry points:
  ├── Web Dashboard (browser)
  ├── MCP Server (Claude Code auto-query)
  └── CLI (terminal quick ops)
```

---

## Database Schema (Drizzle ORM)

### projects

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto increment |
| slug | TEXT UNIQUE | URL-friendly name, e.g. "myagent" |
| name | TEXT | Display name, e.g. "MyAgent" |
| description | TEXT | One-line description |
| icon | TEXT | Emoji icon |
| stage | TEXT | idea / dev / beta / live / paused / archived |
| progress_pct | INTEGER | 0-100 |
| progress_phase | TEXT | e.g. "Phase 2/5" |
| priority | TEXT | high / medium / low |
| tags | TEXT (JSON) | ["AI", "Agent", "Tool"] |
| repo_path | TEXT | ~/Documents/MyAgent |
| github_url | TEXT | https://github.com/xmqywx/MyAgent |
| website_url | TEXT | Docs/official site URL |
| is_public | BOOLEAN | Show on public feedback site |
| auto_record_issues | TEXT | on / off / default |
| auto_record_notes | TEXT | on / off / default |
| auto_session_summary | TEXT | on / off / default |
| auto_load_context | TEXT | on / off / default |
| auto_update_progress | TEXT | on / off / default |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### issues

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| project_id | INTEGER FK | → projects.id |
| title | TEXT | |
| description | TEXT | Markdown |
| type | TEXT | bug / feature / improvement / question / task / note |
| status | TEXT | open / in-review / in-progress / resolved / wont-fix / deferred |
| priority | TEXT | high / medium / low |
| source | TEXT | manual / auto / feedback |
| feedback_id | INTEGER FK | → feedback.id (if converted from feedback) |
| depends_on | TEXT (JSON) | [1, 2] — borrowed from CCPM |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| resolved_at | DATETIME | |

### notes

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| project_id | INTEGER FK | → projects.id |
| title | TEXT | |
| content | TEXT | Markdown |
| source | TEXT | manual / auto / session-summary |
| session_id | TEXT | Claude session ID if auto-generated |
| created_at | DATETIME | |

### feedback

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| project_id | INTEGER FK | → projects.id |
| author_name | TEXT | Optional nickname |
| author_ip | TEXT | For rate limiting |
| title | TEXT | |
| description | TEXT | Markdown |
| type | TEXT | bug / feature / improvement / question |
| status | TEXT | open / under-review / in-progress / resolved / wont-fix / spam |
| upvotes | INTEGER | Default 0 |
| images | TEXT (JSON) | ["/uploads/xxx.png", ...] |
| is_converted | BOOLEAN | Converted to internal issue |
| issue_id | INTEGER FK | → issues.id (if converted) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### feedback_votes

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| feedback_id | INTEGER FK | → feedback.id |
| voter_ip | TEXT | IP-based dedup (anonymous) |
| created_at | DATETIME | |

### git_snapshots

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| project_id | INTEGER FK | → projects.id |
| branch | TEXT | Current branch |
| last_commit_hash | TEXT | |
| last_commit_msg | TEXT | |
| last_commit_date | DATETIME | |
| is_dirty | BOOLEAN | Uncommitted changes |
| ahead | INTEGER | Commits ahead of remote |
| behind | INTEGER | Commits behind remote |
| total_commits | INTEGER | |
| scanned_at | DATETIME | |

### settings

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | Setting key |
| value | TEXT | JSON value |

Default settings:
```json
{
  "scan_paths": ["~/Documents"],
  "scan_exclude": ["node_modules", ".git", "vendor"],
  "auto_record_issues": true,
  "auto_record_notes": false,
  "auto_session_summary": true,
  "auto_load_context": true,
  "auto_update_progress": false,
  "notification_email": "",
  "feedback_rate_limit": 3,
  "feedback_rate_window_minutes": 1
}
```

---

## Plugin Structure

```
devforge/
├── .claude-plugin/
│   └── manifest.json
├── commands/                    # Claude Code slash commands
│   ├── init.md                  # /devforge:init
│   ├── status.md                # /devforge:status
│   ├── issues.md                # /devforge:issues
│   ├── add-issue.md             # /devforge:add-issue
│   ├── note.md                  # /devforge:note
│   ├── summary.md               # /devforge:summary
│   ├── progress.md              # /devforge:progress
│   ├── configure.md             # /devforge:configure
│   └── open.md                  # /devforge:open
├── mcp-server/
│   ├── index.ts                 # MCP server entry
│   └── tools/
│       ├── list-projects.ts
│       ├── get-project.ts
│       ├── add-issue.ts
│       ├── update-issue.ts
│       ├── add-note.ts
│       ├── update-progress.ts
│       ├── get-feedback.ts
│       └── scan.ts
├── cli/
│   └── index.ts                 # devforge CLI
├── db/
│   ├── schema.ts                # Drizzle schema
│   ├── migrate.ts               # Migrations
│   └── client.ts                # DB connection
├── scanner/
│   └── git-scan.ts              # Git repo auto-scanner
├── scripts/                     # Deterministic ops (borrowed from CCPM)
│   ├── status.sh                # Project status report
│   ├── next-issue.sh            # Next actionable issue
│   ├── blocked.sh               # Blocked issues
│   └── validate.sh              # Data consistency check
├── web/                         # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (private)/       # Private dashboard routes
│   │   │   │   ├── page.tsx            # Overview
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx        # Project grid
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx    # Project detail
│   │   │   │   ├── issues/
│   │   │   │   │   └── page.tsx        # Cross-project issues
│   │   │   │   ├── timeline/
│   │   │   │   │   └── page.tsx        # Git activity
│   │   │   │   ├── feedback/
│   │   │   │   │   └── page.tsx        # Feedback management
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx        # Settings + automation
│   │   │   ├── (public)/        # Public routes
│   │   │   │   ├── page.tsx            # Project showcase
│   │   │   │   ├── p/[slug]/
│   │   │   │   │   └── page.tsx        # Public project page
│   │   │   │   ├── feedback/
│   │   │   │   │   ├── page.tsx        # Feedback list + vote
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx    # Submit feedback
│   │   │   │   └── roadmap/
│   │   │   │       └── page.tsx        # Public roadmap
│   │   │   └── api/
│   │   │       ├── projects/
│   │   │       ├── issues/
│   │   │       ├── notes/
│   │   │       ├── feedback/
│   │   │       ├── upload/
│   │   │       └── scan/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── project-card.tsx
│   │   │   ├── issue-list.tsx
│   │   │   ├── feedback-form.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── ...
│   │   └── lib/
│   │       ├── db.ts
│   │       ├── scanner.ts
│   │       └── email.ts
│   ├── public/
│   │   └── uploads/             # Feedback images (local mode)
│   ├── tailwind.config.ts
│   └── next.config.ts
├── package.json
└── README.md
```

---

## Slash Commands Detail

### /devforge:init

**触发场景**：首次使用，或在新项目目录中。

**流程**：
1. 检查 `~/.devforge/devforge.db` 是否存在
   - 不存在 → 创建 DB + 运行 migrations
   - 存在 → 跳过
2. 检查 `~/.claude/settings.json` 中是否已有 devforge MCP
   - 没有 → 自动注册 MCP Server
3. 检测当前目录
   - 有 `.git` → 读取 git remote → 匹配 DB 中的项目
   - 匹配成功 → 加载项目上下文
   - 未匹配 → 提示：是否将此目录注册为新项目？
4. 首次使用 → 触发 `git-scan.ts` 扫描 `scan_paths` 下所有 git 仓库
5. 输出当前项目状态（如果已匹配）

### /devforge:status

**无参数**：显示所有项目概览表格（名称/阶段/进度/open issues/最近commit）
**带参数**：`/devforge:status myagent` 显示单项目详情

内部调用：先跑 `scripts/status.sh` 获取确定性数据，再用 LLM 格式化输出。

### /devforge:issues

列出当前项目（或指定项目）的所有 open issues，按优先级排序。
包含来源标记：`[manual]` `[auto]` `[feedback]`

### /devforge:add-issue

交互式或一句话添加：
- `/devforge:add-issue` → 交互式问标题/类型/优先级
- 对话中说"记个 bug：xxx" → MCP 自动调用 add_issue

### /devforge:note

给当前项目添加 Markdown 笔记。
- `/devforge:note` → 交互式
- 自动模式下 Claude 判断值得记录的发现/决策自动写入

### /devforge:summary

手动触发会话总结：
1. 分析本次对话做了什么
2. 更新相关 Issues 状态（resolved/in-progress）
3. 添加 session summary note
4. 更新项目进度百分比

### /devforge:progress

更新项目进度：
- `/devforge:progress phase 3` → 设置阶段
- `/devforge:progress 60%` → 设置百分比
- `/devforge:progress stage beta` → 设置项目阶段

### /devforge:configure

交互式配置当前项目的自动化选项（auto-issues/notes/summary 等）。

### /devforge:open

在浏览器中打开 Dashboard。如果 Web Server 未运行，自动启动。

---

## MCP Server Tools

### devforge_list_projects

```typescript
{
  name: "devforge_list_projects",
  description: "List all projects with status summary",
  inputSchema: {
    type: "object",
    properties: {
      stage: { type: "string", description: "Filter by stage" },
      priority: { type: "string", description: "Filter by priority" }
    }
  }
}
```

### devforge_get_project

```typescript
{
  name: "devforge_get_project",
  description: "Get full project details including issues, notes, git status, and feedback",
  inputSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "Project slug or auto-detect from cwd" }
    },
    required: ["slug"]
  }
}
```

返回：project info + open issues + recent notes + git snapshot + unread feedback count

### devforge_add_issue

```typescript
{
  name: "devforge_add_issue",
  description: "Add an issue to a project",
  inputSchema: {
    type: "object",
    properties: {
      project_slug: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      type: { type: "string", enum: ["bug", "feature", "improvement", "question", "task", "note"] },
      priority: { type: "string", enum: ["high", "medium", "low"] },
      depends_on: { type: "array", items: { type: "number" } }
    },
    required: ["project_slug", "title"]
  }
}
```

### devforge_update_issue

更新 issue 状态、优先级、描述。

### devforge_add_note

给项目添加 markdown 笔记。

### devforge_update_progress

更新项目进度百分比、阶段、stage。

### devforge_get_feedback

获取项目的外部反馈列表（未处理的优先）。

### devforge_scan

触发 Git 重新扫描，更新 git_snapshots 表。

---

## Web Dashboard Pages

### Private: Overview (/)

- 统计卡片：总项目数 / Active 数 / Open Issues / 未读 Feedback
- 最近活跃项目 Top 5（按 last commit 排序）
- 最近的 Issues 和 Feedback（跨项目）

### Private: Projects (/projects)

- 项目卡片网格（紧凑信息卡）
- 筛选：All / Active / Paused / Archived
- 搜索
- + Add Project 按钮

### Private: Project Detail (/projects/[slug])

- Header: 图标 + 名称 + 描述 + 阶段标签 + Edit
- Stats: Last Commit / Branch / Open Issues / Feedback
- Progress: 阶段进度条
- Tabs: Issues / Notes / Links / Git Log
- Project Info: 路径/GitHub/官网/Tags

### Private: Issues (/issues)

- 跨项目 Issue 列表
- 筛选：项目/状态/优先级/类型/来源
- 批量操作

### Private: Timeline (/timeline)

- Git 活动时间线（所有项目的 commits）
- 按日期分组

### Private: Feedback (/feedback)

- 收到的外部反馈列表
- 状态管理 + 一键转 Issue
- 标记 Spam

### Private: Settings (/settings)

- Automation: 全局默认开关 + 项目级覆盖
- Scan: 扫描路径配置
- Notification: 邮件配置
- Feedback: 频率限制配置

### Public: Home (/)

- 项目展示卡片（仅 is_public=true 的项目）
- 简洁美观

### Public: Project (/p/[slug])

- 项目介绍 + 链接

### Public: Feedback List (/feedback)

- 反馈列表 + 投票
- 按投票数排序
- 状态可见

### Public: Submit Feedback (/feedback/new)

- 选择项目
- 反馈类型（Bug/Feature/改进/问题）
- 标题 + Markdown 描述
- 图片上传（最多5张，5MB/张）
- 可选昵称（不填=匿名）
- 蜜罐隐藏字段 + IP 频率限制（1分钟3条）

### Public: Roadmap (/roadmap)

- 按项目分组
- 显示 status=in-progress 和 planned 的 feedback/issues
- 自动生成

---

## Anti-Spam (Honeypot + Rate Limit)

### Honeypot

```html
<!-- Hidden field, bots will fill it -->
<input name="website" style="display: none" tabindex="-1" autocomplete="off" />
```

Server-side: if `website` field is not empty → reject as spam.

### Rate Limit

- Key: IP address
- Limit: 3 submissions per 1 minute (configurable)
- Storage: In-memory Map with TTL (or SQLite for persistence)

---

## Image Upload

- Endpoint: `POST /api/upload`
- Storage: `public/uploads/` directory (local) or configurable path
- Constraints: max 5 files, 5MB each, PNG/JPG/GIF/WebP only
- Filename: `{timestamp}-{random}.{ext}` (prevent collision)
- Nginx serves `/uploads/` as static files (production)

---

## Email Notification

- Trigger: New feedback submitted
- Transport: Nodemailer with SMTP config
- Template: Simple HTML with feedback title, type, description, link to dashboard

---

## Session Auto-Summary (Hook)

借鉴 CCPM 的 Script-First 原则：

When `auto_session_summary` is ON for a project:
1. Claude Code session ends (via `/exit` or terminal close)
2. Hook triggers `devforge_summary` MCP tool
3. LLM analyzes conversation → extracts:
   - What was done
   - Issues created/resolved
   - Discoveries worth noting
4. Writes session summary note to DB
5. Updates progress if applicable

---

## Context Aggregation ("有什么问题要处理？")

When user asks about pending work, Claude aggregates from 3 sources:

1. **Local docs**: Scan CLAUDE.md, docs/specs/*.md, TODO.md for actionable items
2. **Claude context**: Pending items from current conversation
3. **DevForge DB**: Open/in-progress issues + unread feedback (via MCP)

Merge → dedup → sort by priority → present as unified list with source labels.

---

## Deployment

### Local (Development)

```bash
cd devforge/web
npm run dev
# → http://localhost:3456
# SQLite at ~/.devforge/devforge.db
```

### Server (Production — 106.54.19.137)

```bash
# Build
npm run build

# PM2
pm2 start npm --name devforge -- start

# Nginx
server {
    server_name devforge.yourdomain.com;

    location /uploads/ {
        alias /data/devforge/uploads/;
    }

    location / {
        proxy_pass http://localhost:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Database: PostgreSQL (Drizzle ORM handles the switch via env var).

---

## Borrowed from CCPM (automazeio/ccpm)

### 1. Script-First Rule

确定性操作不走 LLM，直接 SQL 查询或 bash 脚本：

| 操作 | CCPM 做法 | DevForge 做法 |
|------|----------|--------------|
| 查项目状态 | `bash status.sh` (find+grep) | `SELECT status, COUNT(*) FROM issues GROUP BY status` |
| 下一个可做任务 | `bash next.sh` (parse frontmatter) | SQL: 找 status=open 且依赖全 resolved 的 issue |
| 阻塞项 | `bash blocked.sh` | SQL: 找 status=open 且有未完成依赖的 issue |
| 数据校验 | `bash validate.sh` | FK constraints + `devforge validate` 命令 |
| 站会报告 | `bash standup.sh` | SQL 聚合昨日活动 + open issues |

### 2. Dependency Model (from CCPM conventions.md)

CCPM 用 3 个 frontmatter 字段描述任务关系：

```yaml
depends_on: [1, 2]      # 必须先完成的任务
parallel: true           # 能否与其他任务并行
conflicts_with: [5]      # 文件冲突的任务
```

DevForge 在 issues 表中用 `depends_on` JSON 字段实现。核心查询：

```sql
-- 下一个可做的 issue（依赖全部 resolved）
SELECT i.* FROM issues i
WHERE i.status = 'open'
AND i.project_id = ?
AND NOT EXISTS (
  SELECT 1 FROM json_each(i.depends_on) AS dep
  JOIN issues blocked ON blocked.id = dep.value
  WHERE blocked.status NOT IN ('resolved', 'wont-fix')
)
ORDER BY
  CASE i.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
  i.created_at ASC;

-- 阻塞项 + 原因
SELECT i.*, blocked.id as blocking_id, blocked.title as blocking_title
FROM issues i, json_each(i.depends_on) AS dep
JOIN issues blocked ON blocked.id = dep.value
WHERE i.status = 'open'
AND i.project_id = ?
AND blocked.status NOT IN ('resolved', 'wont-fix');
```

### 3. Auto-Completion (from FormalTask)

当 issue 被标记为 resolved 时，自动检查是否解除了其他 issue 的阻塞：

```typescript
async function onIssueResolved(issueId: number) {
  // 找到所有依赖此 issue 的其他 issues
  const dependents = await db.query.issues.findMany({
    where: sql`json_each(depends_on) = ${issueId}`
  });

  for (const dep of dependents) {
    // 检查是否所有依赖都已完成
    const allResolved = await checkAllDepsResolved(dep.id);
    if (allResolved && dep.status === 'open') {
      // 标记为"下一步可做"（Pending Label 概念）
      await markAsNextActionable(dep.id);
    }
  }
}
```

### 4. Standup Report Format (from CCPM standup.sh)

`/devforge:status` 的输出格式借鉴 CCPM 的站会报告结构：

```
📊 DevForge Status — MyAgent
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔨 In Progress (2)
  • #5 webhook fire-and-forget 优化 [high]
  • #7 Tailwind 迁移 [medium]

✅ Recently Completed (24h)
  • #4 Redis 缓存 getUserId

⏭️ Next Actionable (3)
  • #2 tmux 模式测试 [medium] — deps cleared
  • #8 Self-Report API [medium]
  • #9 Output 页面 [low]

🚫 Blocked (1)
  • #6 Integration test — blocked by #5, #7

💬 New Feedback (1)
  • "能否加暗色模式" — 匿名, 3 upvotes

Progress: Phase 2/5 ██████░░░░ 40%
```

### 5. Validate Command (from CCPM validate.sh)

`devforge validate` 检查数据一致性：

```
✅ FK integrity: all references valid
✅ No orphaned issues (all linked to projects)
⚠️ Issue #5 marked in-progress for 7+ days — stale?
⚠️ Project "quant_v3" has no issues — consider adding
❌ Issue #3 depends_on [99] — issue 99 doesn't exist
```

### 6. Init Safety (from CCPM init.sh)

防止误操作：
- 检查是否在 DevForge 自身的 repo 中运行
- 首次 init 显示 ASCII banner + 设置向导
- 自动检测 `gh` CLI、`sqlite3` 等依赖

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Next.js project setup + TailwindCSS 4 + shadcn/ui
- Drizzle ORM + SQLite schema + migrations
- Git scanner (git-scan.ts)
- Seed data from existing ~/Documents projects

### Phase 2: Dashboard (Week 1-2)
- Sidebar layout (56px icon sidebar)
- Overview page with stats
- Projects grid (compact cards)
- Project detail page (tabs: Issues/Notes/Links/Git Log)

### Phase 3: Plugin + MCP (Week 2)
- Claude Code Plugin structure (.claude-plugin/)
- MCP Server with 8 tools
- /devforge:init, :status, :issues, :add-issue
- Deterministic scripts (status.sh, next-issue.sh, blocked.sh)

### Phase 4: Automation (Week 2-3)
- Settings page (automation toggles)
- Auto-record issues (MCP hook)
- Session summary (on session end)
- Context aggregation logic

### Phase 5: CLI (Week 3)
- devforge CLI commands
- npm link for global usage

### Phase 6: Public Feedback (Week 3-4)
- Feedback form + honeypot + rate limit
- Image upload
- Feedback list + voting
- Feedback management (admin)
- Feedback → Issue conversion
- Email notification

### Phase 7: Public Pages (Week 4)
- Project showcase
- Public roadmap
- Deploy to 106.54.19.137

### Phase 8: Polish (Week 4+)
- Motion animations
- ReactBits components
- Dark/light mode
- Mobile responsive
- Plugin marketplace publish
