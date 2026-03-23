# DevForge Private Dashboard V2 — 完整设计文档

## 定位

Private Dashboard (localhost:3102) 是 DevForge 生态的**控制中心**——管理所有项目数据、回复用户反馈、发布版本、编辑路线图。与 Portal (forge.wdao.chat) 的关系：

```
Dashboard (你用)                    Portal (别人看)
├── 读写 CRUD                       ├── 只读展示
├── 管理 93 个项目                   ├── 展示 8 个公开项目
├── 回复 Feedback (Owner)           ├── 提交 Feedback
├── 创建 Release/Milestone          ├── 查看 Release/Milestone
├── 编辑 Issues                     ├── 投票/评论 Issues
├── Push/Pull 同步控制              ├── 被动接收数据
└── 本地 SQLite                     └── 服务器 SQLite
```

## 关键跨服务器交互设计

### 图片上传问题

**Dashboard 上传图片** → 必须传到**服务器**，否则 Portal 无法显示。

```
Dashboard: 用户选图片 → POST https://forge.wdao.chat/api/upload → 返回 URL
Dashboard: 显示图片 → https://forge.wdao.chat/uploads/xxx.png
Portal:    显示图片 → /uploads/xxx.png (同服务器，直接访问)
```

所有 Dashboard 的图片上传都通过服务器 API，不存本地。

### Feedback 图片显示

Dashboard 显示 Feedback 里的图片时，路径是 `/uploads/xxx.png`，需要加服务器域名前缀：
```
/uploads/xxx.png → https://forge.wdao.chat/uploads/xxx.png
```

配置项 `DEVFORGE_SERVER_URL=https://forge.wdao.chat` 已在 .env.local 中。

### Owner 回复

Dashboard 回复 Feedback/Issue 评论时，需要通过**服务器 API** 发送（不是写本地 DB），因为数据要在 Portal 上显示：

```
Dashboard: POST https://forge.wdao.chat/api/feedback/{id}/reply
  Headers: x-owner-secret: devforge-owner-2026
  Body: { content, author_name: "Kris", is_owner: true }
```

## Tech Stack

- Next.js 15 (App Router) — 已有
- TailwindCSS 4 + shadcn/ui — 已有
- Tiptap 富文本编辑器 — 从 Portal 复制
- react-beautiful-dnd 或 @dnd-kit — Issue 看板拖拽
- Drizzle ORM + SQLite — 已有

## 页面结构

```
Layout: TopNav (Logo + 导航 tabs) + Main Content
导航: Overview | Projects | Issues | Feedback | Releases | Milestones | Sync | Settings | Docs

URL 结构:
/                    → Overview (全局统计)
/projects            → 项目列表 (CRUD)
/projects/[slug]     → 项目详情编辑
/issues              → 跨项目 Issue 看板
/feedback            → Feedback 管理 (从服务器 pull)
/releases            → Release 管理
/milestones          → Milestone 管理
/sync                → 同步控制面板
/settings            → 设置 (9个子页)
/docs                → 操作说明/文档中心
```

---

## 1. Overview 页面 (/)

**统计卡片行 (4 列)**:
- 总项目数 / 公开项目数
- Open Issues / 已解决 (7天)
- 未读 Feedback
- 最近同步时间

**最近活动** (时间线):
- 最近创建/关闭的 issues
- 最近的 feedback
- 最近的 releases
- 最近的 git commits

**快捷操作栏**:
- [Scan Git] [Push to Server] [Pull Feedback] [New Issue] [New Release]

---

## 2. Projects 页面 (/projects)

**功能**:
- 项目表格视图 (不是卡片，效率优先)
- 列: 名称 | 阶段 | 进度 | Issues | 公开 | 最后更新 | 操作
- 行内快速编辑: 阶段(下拉)、进度(slider)、公开(toggle)
- 搜索 + 阶段筛选
- 批量操作: 选中多个 → 改阶段 / 设公开 / 归档
- "+ 新项目" 按钮

**项目详情编辑 (/projects/[slug])**:
- 表单编辑所有字段:
  - 名称、slug、描述 (Tiptap 富文本)
  - 阶段 (下拉)、优先级 (下拉)
  - 进度百分比 (slider) + 阶段文字
  - 标签 (tag input，回车添加)
  - 图标 (emoji picker 或文字输入)
  - GitHub URL、Website URL
  - is_public toggle
  - README (Tiptap 大编辑器，或从文件同步按钮)
- 侧边栏: 关联的 Issues / Notes / Releases / Milestones
- "在 Portal 中预览" 按钮 → 新标签页打开 forge.wdao.chat/projects/{slug}

---

## 3. Issues 页面 (/issues)

**可拖拽看板** (4 列):
```
┌──────────┬──────────┬──────────┬──────────┐
│  Open    │ Progress │  Done    │  Closed  │
│  ↕ 拖拽   │  ↕ 拖拽   │  ↕ 拖拽   │  ↕ 拖拽   │
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │
│ [Card]   │          │ [Card]   │          │
└──────────┴──────────┴──────────┴──────────┘
```

**卡片内容**:
- 优先级点 + 标题
- 项目名 (链接) + 类型 pill
- 来源 (manual/auto/feedback)

**拖拽改状态**: 拖到另一列 → 自动 PATCH status

**筛选栏**:
- 项目下拉 (筛选单个项目)
- 优先级 pill 按钮
- 类型 pill 按钮
- 搜索

**"+ 新 Issue" 按钮** → 弹出表单:
- 选择项目 (下拉)
- 标题、描述 (Tiptap)
- 类型、优先级、依赖 (多选)

**Issue 详情抽屉** (点击卡片):
- 右侧抽屉，可编辑所有字段
- 评论列表 (从服务器 pull)
- Owner 回复输入框 (POST 到服务器)

---

## 4. Feedback 页面 (/feedback)

**数据来源**: 从服务器 pull (`GET https://forge.wdao.chat/api/sync/pull`)

**列表视图**:
- 每条 Feedback 卡片:
  - 头像 (DiceBear) + 作者名 + 时间
  - 标题 + 描述预览 (SafeHtml 渲染)
  - 图片缩略图 (**URL 加服务器域名前缀**)
  - 类型 pill + 状态 pill + 投票数
  - 操作: [回复] [转为 Issue] [标记 Spam] [改状态]

**状态管理下拉**:
```
Open → Under Review → In Progress → Resolved / Won't Fix / Spam
```
改状态 → PATCH `https://forge.wdao.chat/api/feedback/{id}` (直接改服务器数据)

**回复** (点击展开):
- Tiptap 富文本编辑器
- 图片上传 → **POST 到服务器** `https://forge.wdao.chat/api/upload`
- 发送 → POST `https://forge.wdao.chat/api/feedback/{id}/reply`
  - Headers: `x-owner-secret: devforge-owner-2026`
  - Body: `{ content, author_name: "Kris", avatar_url: null }`
  - `is_owner` 由服务器根据 secret 自动设为 true

**"转为 Issue" 按钮**:
- 将 feedback 标题/描述复制到新 Issue 表单
- 选择项目、设置优先级
- 创建 Issue 到本地 DB
- 标记 feedback 为 converted
- Push 同步到服务器

**"Pull 更新" 按钮**: 手动触发 pull 获取最新 feedback

**自动 Pull**: 页面打开时自动 pull，之后每 60 秒轮询

---

## 5. Releases 页面 (/releases)

**列表**:
- 按项目分组 或 按时间排序
- 每条: 版本号 pill + 标题 + 日期 + 项目名
- 搜索 + 项目筛选

**"+ 新 Release" 按钮** → 弹出/抽屉:
- 选择项目
- 版本号输入 (建议下一个版本，如 v0.5.0)
- 标题
- Changelog (Tiptap 富文本)
- 下载 URL (可选)
- "从 Git 生成" 按钮: 读取最近的 git commits 自动生成 changelog 草稿

**编辑**: 点击已有 release → 抽屉编辑所有字段

---

## 6. Milestones 页面 (/milestones)

**时间线编辑器**:
- 类似 Portal 的锯齿形时间线，但可编辑
- 每个节点: 标题 | 描述 | 日期 | 状态 | 图标
- 点击节点 → 弹出编辑表单
- 拖拽排序

**"+ 新 Milestone" 按钮**:
- 项目 (下拉)
- 标题、描述
- 日期 (date picker)
- 状态 (completed / current / planned)
- 图标 (milestone / launch / pivot / idea / integration)

---

## 7. Sync 页面 (/sync)

**同步状态面板**:
```
┌─────────────────────────────────────────┐
│  Last Push: 2026-03-23 13:05            │
│  Last Pull: 2026-03-23 13:02            │
│  Server: https://forge.wdao.chat ✅     │
│  Auto-Sync: ON (after every MCP write)  │
└─────────────────────────────────────────┘
```

**操作按钮**:
- [Push Now] — 推送项目/issues/notes/releases/milestones 到服务器
- [Pull Now] — 拉取 feedback/votes/comments 到本地
- [Full Sync] — 双向同步

**同步日志** (最近 20 条):
```
13:05 PUSH 8 projects, 68 issues, 12 notes → OK
13:02 PULL 3 feedback, 2 comments → OK
12:30 AUTO-PUSH after devforge_add_issue → OK
12:15 PULL → Error: fetch failed (retrying...)
```

**统计对比**:
| 数据 | 本地 | 服务器 | 差异 |
| Projects | 93 | 8 | 本地多 (only public sync) |
| Issues | 68 | 68 | 同步 ✅ |
| Feedback | 5 | 3 | 本地多 2 (local only) |

---

## 8. Portal 预览

在项目详情页添加一个 "Preview on Portal" 按钮:
- 点击打开新标签页: `https://forge.wdao.chat/projects/{slug}`
- 或在 Dashboard 内 iframe 预览 (可选)

---

## 9. Settings 页面 (/settings)

**Tab 式子页面结构**:

### 9.1 扫描配置 (/settings/scan)
```
扫描路径:
[~/Documents                    ] [删除]
[+ 添加路径]

排除目录:
[node_modules, .git, vendor, dist, .next, __pycache__]

扫描频率:
○ 手动  ○ 每小时  ○ 每天  ● 每次 init 时

[保存] [立即扫描]
```

### 9.2 同步配置 (/settings/sync)
```
服务器 URL:
[https://forge.wdao.chat        ]

Sync Secret:
[••••••••••••••••                ] [显示/隐藏]

Owner Secret:
[••••••••••••••••                ] [显示/隐藏]

自动同步:
☑ MCP 写操作后自动 push
☑ 打开 Feedback 页面时自动 pull
○ 定时同步: 每 [5] 分钟

[保存] [测试连接]
```

### 9.3 自动化配置 (/settings/automation)
```
全局默认:
  Auto-record issues:    [ON ▼]
  Auto-record notes:     [OFF ▼]
  Session summary:       [ON ▼]
  Auto-load context:     [ON ▼]
  Auto-update progress:  [OFF ▼]

项目级覆盖: (表格)
  MyAgent:     issues=ON  notes=ON   summary=ON   [Default] [Default]
  SkillPocket: [Default]  [Default]  [Default]    [Default] [Default]
  ...
```

### 9.4 通知配置 (/settings/notifications)
```
邮件通知:
  SMTP Host:     [smtp.gmail.com           ]
  SMTP Port:     [465                      ]
  SMTP User:     [your@email.com           ]
  SMTP Password: [••••••••                 ]
  发件人:         [DevForge <noreply@...>   ]

通知邮箱:
  [kris@example.com                        ]

通知触发:
  ☑ 新 Feedback 提交
  ☑ 新 Issue 评论
  ☐ Issue 状态变更

[保存] [发送测试邮件]
```

### 9.5 MCP 配置 (/settings/mcp)
```
MCP Server 状态:
  路径: /Users/ying/Documents/DevForge/mcp-server/start.sh
  注册文件: ~/.claude.json
  状态: ✅ 已注册

工具列表 (12 个):
  1. devforge_list_projects    ✅
  2. devforge_get_project      ✅
  3. devforge_add_issue        ✅
  ...

[重新注册 MCP] [测试 MCP 连接]
```

### 9.6 Plugin 配置 (/settings/plugin)
```
Plugin 状态:
  安装路径: ~/.claude/plugins/cache/devforge/
  版本: 1.0.0
  类型: Symlink → /Users/ying/Documents/DevForge

命令列表 (12 个):
  /devforge:init          ✅
  /devforge:df-status     ✅
  /devforge:df-issues     ✅
  ...

[Reload Plugins]
```

### 9.7 数据库 (/settings/database)
```
数据库路径: ~/.devforge/devforge.db
大小: 78 KB

表统计:
  projects:       93 行
  issues:         68 行
  notes:          15 行
  releases:       10 行
  milestones:     13 行
  feedback:        6 行
  git_snapshots: 100 行

[导出 DB 备份] [导入 DB]
```

### 9.8 主题 (/settings/theme)
```
● 浅色 (当前)
○ 暗色
○ 跟随系统
```

### 9.9 语言 (/settings/language)
```
● English
○ 中文
```

---

## 10. 操作说明/文档中心 (/docs)

**侧边栏导航 + 内容区**:

```
左侧导航:                    右侧内容:
├── Getting Started          ┌──────────────────────┐
├── Slash Commands           │  # Getting Started   │
├── MCP Tools                │                      │
├── CLI Commands             │  DevForge 是...      │
├── Bash Scripts             │  ## 安装             │
├── Sync Mechanism           │  ```bash             │
├── Deploy Guide             │  curl -fsSL ...      │
├── Troubleshooting          │  ```                 │
└── FAQ                      │  ## 首次使用         │
                             │  /devforge:init      │
                             └──────────────────────┘
```

### 文档内容:

**Getting Started**:
- 什么是 DevForge
- 安装方法 (curl 一键安装)
- 首次使用 (/devforge:init)
- Dashboard vs Portal 的区别

**Slash Commands** (12 个):
```
| 命令 | 说明 | 示例 |
|------|------|------|
| /devforge:init | 初始化项目 | 检测当前目录，加载上下文 |
| /devforge:df-status | 查看状态 | 显示项目进度和 issues |
| /devforge:df-issues | 查看 issues | 列出 open issues |
| /devforge:df-add-issue | 添加 issue | 创建新 issue |
| /devforge:df-note | 添加笔记 | 记录设计决策 |
| /devforge:df-summary | 会话总结 | 自动分析对话并记录 |
| /devforge:df-progress | 更新进度 | 设置百分比或阶段 |
| /devforge:df-configure | 配置 | 自动化开关 |
| /devforge:df-release | 发布版本 | 自动生成 changelog |
| /devforge:df-sync | 同步 | push/pull 到服务器 |
| /devforge:df-scan | 扫描 | 重新扫描 git 仓库 |
| /devforge:open | 打开 Dashboard | 浏览器打开 |
```

**MCP Tools** (12 个):
```
| 工具 | 说明 | 参数 |
|------|------|------|
| devforge_list_projects | 列出项目 | stage? |
| devforge_get_project | 项目详情 | slug |
| devforge_add_issue | 添加 issue | project_slug, title, type?, priority? |
| devforge_update_issue | 更新 issue | id, status?, priority? |
| devforge_add_note | 添加笔记 | project_slug, title, content |
| devforge_update_progress | 更新进度 | project_slug, progress_pct?, stage? |
| devforge_get_feedback | 获取反馈 | project_slug? |
| devforge_scan | 扫描仓库 | paths? |
| devforge_add_release | 发布版本 | project_slug, version, title, content |
| devforge_add_milestone | 添加里程碑 | project_slug, title, status, date |
| devforge_update_readme | 更新 README | project_slug, content? |
| devforge_sync | 同步 | direction? |
```

**CLI Commands**:
```bash
devforge status [project]     # 查看状态
devforge issue add <project> <title> [-p high] [-t bug]
devforge issue list [project]
devforge issue close <id>
devforge scan                 # 扫描 git 仓库
devforge sync [push|pull|both]
devforge open                 # 打开 Dashboard
```

**Bash Scripts**:
```bash
scripts/status.sh             # 项目统计
scripts/next-issue.sh <slug>  # 下一个可做的 issue
scripts/blocked.sh <slug>     # 阻塞的 issues
scripts/sync.ts               # 双向同步
scripts/register-mcp.sh       # 注册 MCP
```

**Sync Mechanism**:
- Push: 本地 → 服务器 (projects, issues, notes, releases, milestones)
- Pull: 服务器 → 本地 (feedback, replies, votes, comments)
- Auto-sync: 每次 MCP 写操作后自动 push
- 手动: `devforge sync both`

**Deploy Guide (Portal)**:
```bash
# 1. rsync 源码到服务器
rsync -avz --exclude node_modules --exclude .next --exclude .git --exclude .env.local --exclude devforge.db -e ssh . root@106.54.19.137:/opt/devforge-portal/

# 2. 服务器 build + restart
ssh root@106.54.19.137 "cd /opt/devforge-portal && npm install && rm -rf .next && npm run build && pm2 restart devforge-portal"

# 3. 同步数据
npx tsx scripts/sync.ts push
```

**Troubleshooting**:
- MCP 工具找不到: 先运行 ToolSearch("devforge") 加载
- 图片不显示: 检查服务器 uploads 目录权限
- 同步失败: 检查 DEVFORGE_SERVER_URL 是否用 https://
- Plugin 命令不显示: 部分命令名与内置冲突，直接输入完整名可用
- Hydration 错误: 清除 .next 缓存 (rm -rf .next)

**FAQ**:
- Q: Dashboard 和 Portal 用同一个数据库吗？
  A: 不。Dashboard 用本地 SQLite，Portal 用服务器 SQLite，通过 sync API 同步。

- Q: 图片存在哪里？
  A: 服务器 /data/devforge/uploads/，通过 Nginx 静态服务。Dashboard 上传也传到服务器。

- Q: 如何给新项目添加到 Portal？
  A: 在 Dashboard 中设置 is_public=true，然后 push 同步。

---

## 实施分期

### Phase 1: 核心 CRUD (Week 1)
- 项目列表 (表格 + 行内编辑)
- 项目详情编辑页
- Issue 看板 (拖拽)
- 导航 + 布局改版

### Phase 2: 远程交互 (Week 1-2)
- Feedback 管理 (从服务器 pull + Owner 回复)
- 图片上传到服务器
- 同步控制面板

### Phase 3: 内容管理 (Week 2)
- Release 管理
- Milestone 管理
- Portal 预览

### Phase 4: 设置 + 文档 (Week 2-3)
- 9 个设置子页
- 操作说明/文档中心

### Phase 5: 打磨 (Week 3)
- i18n 中英文
- 主题切换
- 动画/交互优化
