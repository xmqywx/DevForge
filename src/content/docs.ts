export interface DocSection {
  slug: string;
  title: string;
  titleKey: string;
  content: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    titleKey: "docs.gettingStarted",
    content: `
<h1>快速开始</h1>

<h2>什么是 DevForge？</h2>
<p>DevForge 是一个综合性的个人项目管理中心，通过 MCP Server 和 Plugin 系统与 Claude Code 深度集成。它可以追踪 90+ 个 Git 仓库，并提供项目管理、Issue 跟踪和社区反馈功能。</p>

<h2>Dashboard vs Portal</h2>
<table>
  <thead><tr><th>Dashboard（本地 localhost:3102）</th><th>Portal（服务器 forge.wdao.chat）</th></tr></thead>
  <tbody>
    <tr><td>完整的读写 CRUD</td><td>只读展示</td></tr>
    <tr><td>管理 93+ 个项目</td><td>展示 8 个公开项目</td></tr>
    <tr><td>回复反馈（管理员）</td><td>提交反馈</td></tr>
    <tr><td>创建 Release / Milestone</td><td>查看 Release / Milestone</td></tr>
    <tr><td>编辑 Issue</td><td>投票 / 评论 Issue</td></tr>
    <tr><td>推送 / 拉取同步控制</td><td>被动接收数据</td></tr>
    <tr><td>本地 SQLite</td><td>服务器 SQLite</td></tr>
  </tbody>
</table>

<h2>一键安装</h2>
<pre><code class="language-bash">curl -fsSL https://raw.githubusercontent.com/xmqywx/DevForge/master/install.sh | bash</code></pre>

<h2>手动安装</h2>
<pre><code class="language-bash">git clone https://github.com/xmqywx/DevForge.git
cd DevForge
npm install
npx drizzle-kit push
bash scripts/register-mcp.sh</code></pre>

<h2>首次使用</h2>
<p>在 Claude Code 中运行 <code>/devforge:init</code> 来初始化并检测当前项目。DevForge 会自动扫描你的 Git 仓库、加载项目上下文，并激活所有 MCP 工具。</p>

<h2>环境要求</h2>
<ul>
  <li>Node.js 18+</li>
  <li>Claude Code（需支持 MCP）</li>
  <li>主目录下有 Git 仓库</li>
</ul>
    `,
  },
  {
    slug: "slash-commands",
    title: "Slash Commands",
    titleKey: "docs.slashCommands",
    content: `
<h1>斜杠命令</h1>

<p>斜杠命令在 Claude Code 对话中使用。它们会触发 Claude 加载上下文并通过 DevForge Plugin 系统执行操作。</p>

<h2>全部 12 个命令</h2>

<table>
  <thead>
    <tr><th>命令</th><th>说明</th><th>使用场景</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/devforge:init</code></td>
      <td>初始化项目 — 检测当前目录，加载上下文，激活 MCP 工具</td>
      <td>每次会话开始时运行</td>
    </tr>
    <tr>
      <td><code>/devforge:df-status</code></td>
      <td>查看项目状态 — 显示进度百分比、阶段、待处理 Issue</td>
      <td>快速检查项目健康状况</td>
    </tr>
    <tr>
      <td><code>/devforge:df-issues</code></td>
      <td>列出未完成 Issue — 显示当前项目所有 open 和 in-progress 的 Issue</td>
      <td>开始工作前选择下一个任务</td>
    </tr>
    <tr>
      <td><code>/devforge:df-add-issue</code></td>
      <td>新增 Issue — 创建 bug、feature 或 task，可设置优先级</td>
      <td>工作中发现 bug 时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-note</code></td>
      <td>添加笔记 — 记录设计决策、架构笔记或观察记录</td>
      <td>做出重要设计决策后</td>
    </tr>
    <tr>
      <td><code>/devforge:df-summary</code></td>
      <td>会话总结 — 自动分析对话内容并记录完成的工作</td>
      <td>每次工作会话结束时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-progress</code></td>
      <td>更新进度 — 设置完成百分比或更改项目阶段</td>
      <td>完成一个 Milestone 或阶段后</td>
    </tr>
    <tr>
      <td><code>/devforge:df-configure</code></td>
      <td>配置自动化 — 开关自动记录 Issue、笔记、会话总结</td>
      <td>自定义项目的 DevForge 行为</td>
    </tr>
    <tr>
      <td><code>/devforge:df-release</code></td>
      <td>创建 Release — 根据近期 Git 提交自动生成 Changelog</td>
      <td>发布新版本时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-sync</code></td>
      <td>同步数据 — 推送本地数据到服务器或拉取用户反馈</td>
      <td>本地改动需要同步到 Portal 时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-scan</code></td>
      <td>扫描 Git 仓库 — 重新扫描配置路径以发现新仓库</td>
      <td>创建新项目后</td>
    </tr>
    <tr>
      <td><code>/devforge:open</code></td>
      <td>打开 Dashboard — 在浏览器中打开 localhost:3102</td>
      <td>查看 Dashboard 界面</td>
    </tr>
  </tbody>
</table>

<h2>使用技巧</h2>
<ul>
  <li>每次会话开始时务必运行 <code>/devforge:init</code> 加载上下文</li>
  <li>命令区分大小写 — 请使用上表中的完整名称</li>
  <li>如果命令没有出现在自动补全中，直接输入完整名称即可</li>
  <li>部分命令名可能与 Claude 内置命令冲突 — 使用完整名称可覆盖</li>
</ul>

<h2>自动记录规则</h2>
<p>根据 <code>CLAUDE.md</code> 的配置，Claude 会主动调用 MCP 工具，无需手动触发：</p>
<ul>
  <li>发现 bug → 立即调用 <code>devforge_add_issue</code></li>
  <li>用户报告问题 → 立即调用 <code>devforge_add_issue</code></li>
  <li>修复 Issue → 调用 <code>devforge_update_issue</code> 标记完成</li>
  <li>做出设计决策 → 调用 <code>devforge_add_note</code></li>
  <li>会话结束 → 通过 <code>devforge_add_note</code> 记录总结</li>
</ul>
    `,
  },
  {
    slug: "mcp-tools",
    title: "MCP Tools",
    titleKey: "docs.mcpTools",
    content: `
<h1>MCP 工具</h1>

<p>MCP（Model Context Protocol）工具由 Claude Code 直接调用，与本地 SQLite 数据库和服务器 API 交互。</p>

<h2>工具参考</h2>

<table>
  <thead>
    <tr><th>工具</th><th>说明</th><th>关键参数</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>devforge_list_projects</code></td>
      <td>列出所有项目，可按阶段筛选</td>
      <td><code>stage?</code>（idea/active/shipped/archived）</td>
    </tr>
    <tr>
      <td><code>devforge_get_project</code></td>
      <td>获取项目完整信息，包括 Issue、笔记、Release</td>
      <td><code>slug</code>（必填）</td>
    </tr>
    <tr>
      <td><code>devforge_add_issue</code></td>
      <td>为项目创建新 Issue</td>
      <td><code>project_slug</code>, <code>title</code>, <code>type?</code>, <code>priority?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_issue</code></td>
      <td>更新 Issue 的状态、优先级等字段</td>
      <td><code>id</code>, <code>status?</code>, <code>priority?</code>, <code>title?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_note</code></td>
      <td>添加笔记（设计决策、观察记录、会话总结）</td>
      <td><code>project_slug</code>, <code>title</code>, <code>content</code>, <code>type?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_progress</code></td>
      <td>更新项目进度百分比或阶段</td>
      <td><code>project_slug</code>, <code>progress_pct?</code>, <code>stage?</code>, <code>stage_text?</code></td>
    </tr>
    <tr>
      <td><code>devforge_get_feedback</code></td>
      <td>获取反馈列表，可按项目筛选</td>
      <td><code>project_slug?</code>, <code>status?</code></td>
    </tr>
    <tr>
      <td><code>devforge_scan</code></td>
      <td>扫描目录中的 Git 仓库并更新项目列表</td>
      <td><code>paths?</code>（目录路径数组）</td>
    </tr>
    <tr>
      <td><code>devforge_add_release</code></td>
      <td>创建新 Release，包含版本号和 Changelog</td>
      <td><code>project_slug</code>, <code>version</code>, <code>title</code>, <code>content</code>, <code>date?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_milestone</code></td>
      <td>添加项目 Milestone，包含日期和状态</td>
      <td><code>project_slug</code>, <code>title</code>, <code>status</code>, <code>date</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_readme</code></td>
      <td>更新项目 README 内容</td>
      <td><code>project_slug</code>, <code>content?</code>（省略则自动从文件读取）</td>
    </tr>
    <tr>
      <td><code>devforge_sync</code></td>
      <td>在本地数据库和服务器之间同步数据</td>
      <td><code>direction?</code>（push/pull/both，默认 both）</td>
    </tr>
  </tbody>
</table>

<h2>工具加载</h2>
<p>如果 MCP 工具没有出现，可以调用 <code>ToolSearch("devforge")</code> 来加载。这是 MCP 系统的已知问题 — 新对话中首次使用前需要先拉取工具列表。</p>

<pre><code class="language-text">// 在 Claude Code 中，如果工具未显示：
ToolSearch("devforge")
// 然后正常使用工具即可</code></pre>

<h2>Issue 类型</h2>
<ul>
  <li><code>bug</code> — 功能异常</li>
  <li><code>feature</code> — 新功能</li>
  <li><code>task</code> — 工作项或日常任务</li>
  <li><code>improvement</code> — 对现有功能的改进</li>
</ul>

<h2>Issue 优先级</h2>
<ul>
  <li><code>critical</code> — 阻塞一切，立即修复</li>
  <li><code>high</code> — 重要，尽快处理</li>
  <li><code>medium</code> — 正常优先级（默认）</li>
  <li><code>low</code> — 有空再做</li>
</ul>

<h2>Issue 状态</h2>
<ul>
  <li><code>open</code> — 未开始</li>
  <li><code>in-progress</code> — 进行中</li>
  <li><code>in-review</code> — 代码已写完，等待审查</li>
  <li><code>done</code> — 已完成</li>
  <li><code>closed</code> — 不修复或重复</li>
</ul>
    `,
  },
  {
    slug: "cli-commands",
    title: "CLI Commands",
    titleKey: "docs.cliCommands",
    content: `
<h1>CLI 命令</h1>

<p><code>devforge</code> CLI 提供终端访问 DevForge 功能的能力。适用于脚本自动化、不打开 Claude Code 时的快速操作。</p>

<h2>安装</h2>
<p>CLI 会在安装脚本执行时自动安装。安装完成后，<code>devforge</code> 命令全局可用。</p>

<pre><code class="language-bash"># 验证安装
devforge --version

# 获取帮助
devforge --help</code></pre>

<h2>命令列表</h2>

<h3>status</h3>
<pre><code class="language-bash">devforge status [project-slug]

# 示例：
devforge status                  # 全局概览
devforge status my-agent         # 查看指定项目状态</code></pre>
<p>显示项目进度、阶段、未完成 Issue 数量和最近活动。</p>

<h3>issue</h3>
<pre><code class="language-bash">devforge issue add &lt;project&gt; &lt;title&gt; [options]
devforge issue list [project]
devforge issue close &lt;id&gt;

# add 的选项：
#   -p, --priority &lt;level&gt;    critical|high|medium|low
#   -t, --type &lt;type&gt;         bug|feature|task|improvement
#   -d, --description &lt;text&gt;  Issue 描述

# 示例：
devforge issue add my-app "Fix login bug" -p high -t bug
devforge issue list my-app
devforge issue close 42</code></pre>

<h3>scan</h3>
<pre><code class="language-bash">devforge scan [paths...]

# 示例：
devforge scan                           # 扫描默认配置路径
devforge scan ~/Documents ~/Projects   # 扫描指定目录</code></pre>
<p>扫描目录中的 Git 仓库并更新项目数据库。</p>

<h3>sync</h3>
<pre><code class="language-bash">devforge sync [direction]

# 方向：push | pull | both（默认 both）

# 示例：
devforge sync           # 双向同步
devforge sync push      # 推送本地数据到服务器
devforge sync pull      # 从服务器拉取反馈</code></pre>

<h3>open</h3>
<pre><code class="language-bash">devforge open           # 在默认浏览器中打开 localhost:3102</code></pre>

<h2>退出码</h2>
<ul>
  <li><code>0</code> — 成功</li>
  <li><code>1</code> — 一般错误</li>
  <li><code>2</code> — 未找到（项目、Issue 等）</li>
  <li><code>3</code> — 网络错误（同步失败）</li>
</ul>
    `,
  },
  {
    slug: "bash-scripts",
    title: "Bash Scripts",
    titleKey: "docs.bashScripts",
    content: `
<h1>Bash 脚本</h1>

<p><code>scripts/</code> 目录包含常用操作的工具脚本，是 CLI 命令的底层替代方案。</p>

<h2>scripts/status.sh</h2>
<pre><code class="language-bash">bash scripts/status.sh [project-slug]</code></pre>
<p>打印所有项目或指定项目的摘要 — 阶段、进度、未完成 Issue、最后提交日期。</p>

<h2>scripts/next-issue.sh</h2>
<pre><code class="language-bash">bash scripts/next-issue.sh &lt;project-slug&gt;

# 示例：
bash scripts/next-issue.sh my-agent</code></pre>
<p>返回优先级最高且没有阻塞依赖的 open Issue。适合快速决定下一步要做什么。</p>

<h2>scripts/blocked.sh</h2>
<pre><code class="language-bash">bash scripts/blocked.sh &lt;project-slug&gt;

# 示例：
bash scripts/blocked.sh devforge</code></pre>
<p>列出所有被阻塞的 Issue（有未解决的依赖）。显示阻塞链，帮你优先解决阻塞项。</p>

<h2>scripts/sync.ts</h2>
<pre><code class="language-bash">npx tsx scripts/sync.ts [push|pull|both]

# 示例：
npx tsx scripts/sync.ts push   # 推送到服务器
npx tsx scripts/sync.ts pull   # 拉取反馈
npx tsx scripts/sync.ts both   # 完整双向同步（默认）</code></pre>
<p>TypeScript 同步脚本。处理推送（projects、issues、notes、releases、milestones → 服务器）和拉取（feedback、votes、comments → 本地）。</p>

<h2>scripts/register-mcp.sh</h2>
<pre><code class="language-bash">bash scripts/register-mcp.sh</code></pre>
<p>在 <code>~/.claude.json</code> 中注册 DevForge MCP Server。首次安装后或 MCP 工具消失时运行。</p>

<h2>在 CI / 自动化中使用</h2>
<pre><code class="language-bash"># 示例：部署后自动同步
npm run build
pm2 restart devforge-portal
npx tsx scripts/sync.ts push</code></pre>
    `,
  },
  {
    slug: "sync-mechanism",
    title: "Sync Mechanism",
    titleKey: "docs.syncMechanism",
    content: `
<h1>同步机制</h1>

<p>DevForge 采用单向同步模型来保持本地 Dashboard 和远程 Portal 的数据一致。</p>

<h2>架构</h2>

<pre><code class="language-text">Dashboard（本地 SQLite）        Portal（服务器 SQLite）
        │                               │
        │ ──── PUSH ────────────────→  │
        │  projects, issues, notes      │
        │  releases, milestones         │
        │                               │
        │ ←─── PULL ─────────────────  │
        │  feedback, replies            │
        │  votes, comments              │
        │                               </code></pre>

<h2>Push（本地 → 服务器）</h2>
<p>Push 将本地数据发送到 Portal 服务器。仅同步<em>公开</em>项目。</p>
<ul>
  <li><strong>Projects</strong> — 仅 <code>is_public = true</code> 的项目</li>
  <li><strong>Issues</strong> — 公开项目的所有 Issue</li>
  <li><strong>Notes</strong> — 公开项目的所有笔记</li>
  <li><strong>Releases</strong> — 公开项目的所有 Release</li>
  <li><strong>Milestones</strong> — 公开项目的所有 Milestone</li>
</ul>

<pre><code class="language-bash"># 手动推送
devforge sync push
# 或
npx tsx scripts/sync.ts push</code></pre>

<h2>Pull（服务器 → 本地）</h2>
<p>Pull 从 Portal 服务器拉取用户生成的内容。</p>
<ul>
  <li><strong>Feedback</strong> — 用户从 Portal 提交的反馈</li>
  <li><strong>Replies</strong> — 反馈帖中的回复</li>
  <li><strong>Votes</strong> — 反馈和 Issue 的投票</li>
</ul>

<pre><code class="language-bash"># 手动拉取
devforge sync pull
# 或
npx tsx scripts/sync.ts pull</code></pre>

<h2>自动同步</h2>
<p>自动同步在以下两种情况下触发：</p>
<ol>
  <li><strong>每次 MCP 写操作后</strong> — 调用 <code>devforge_add_issue</code>、<code>devforge_add_note</code>、<code>devforge_update_issue</code> 等会自动触发推送</li>
  <li><strong>打开反馈页面时</strong> — 反馈页面加载时自动拉取，之后每 60 秒轮询一次</li>
</ol>

<h2>Sync API 端点</h2>
<pre><code class="language-text">POST https://forge.wdao.chat/api/sync/push
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Body: { projects, issues, notes, releases, milestones }

GET  https://forge.wdao.chat/api/sync/pull
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Returns: { feedback, replies, votes }</code></pre>

<h2>配置</h2>
<p>在 <code>.env.local</code> 中设置：</p>
<pre><code class="language-bash">DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_SYNC_SECRET=your-sync-secret
DEVFORGE_OWNER_SECRET=devforge-owner-2026</code></pre>

<h2>冲突处理</h2>
<p>DevForge 采用<em>后写入优先</em>策略。服务器是反馈/投票的数据源，本地是项目数据的数据源。</p>
    `,
  },
  {
    slug: "deploy-guide",
    title: "Deploy Guide",
    titleKey: "docs.deployGuide",
    content: `
<h1>部署指南</h1>

<p>Portal（<code>forge.wdao.chat</code>）部署在 Linux VPS 上，使用 rsync + PM2。没有 GitHub Actions 流水线 — 通过 SSH 手动部署。</p>

<h2>部署步骤</h2>

<h3>第一步：rsync 源代码到服务器</h3>
<pre><code class="language-bash">rsync -avz \\
  --exclude node_modules \\
  --exclude .next \\
  --exclude .git \\
  --exclude .env.local \\
  --exclude devforge.db \\
  -e ssh \\
  . root@106.54.19.137:/opt/devforge-portal/</code></pre>

<h3>第二步：在服务器上构建并重启</h3>
<pre><code class="language-bash">ssh root@106.54.19.137 "cd /opt/devforge-portal && npm install && rm -rf .next && npm run build && pm2 restart devforge-portal"</code></pre>

<h3>第三步：同步数据</h3>
<pre><code class="language-bash">npx tsx scripts/sync.ts push</code></pre>

<h2>完整部署脚本</h2>
<pre><code class="language-bash">#!/bin/bash
# deploy.sh — 部署 Portal 到生产环境

set -e

echo "=== 部署 DevForge Portal ==="

# 1. rsync 同步文件
echo "→ 同步文件..."
rsync -avz \\
  --exclude node_modules \\
  --exclude .next \\
  --exclude .git \\
  --exclude .env.local \\
  --exclude devforge.db \\
  -e ssh \\
  . root@106.54.19.137:/opt/devforge-portal/

# 2. 服务器上构建
echo "→ 构建中..."
ssh root@106.54.19.137 "
  cd /opt/devforge-portal
  npm install
  rm -rf .next
  npm run build
  pm2 restart devforge-portal
"

# 3. 推送数据同步
echo "→ 同步数据..."
npx tsx scripts/sync.ts push

echo "=== 部署完成 ==="
echo "Portal: https://forge.wdao.chat"</code></pre>

<h2>服务器目录结构</h2>
<pre><code class="language-text">/opt/devforge-portal/
├── src/
├── .next/          （构建产物）
├── .env.local      （服务器环境变量）
├── devforge.db     （服务器 SQLite）
└── package.json

/data/devforge/
└── uploads/        （用户上传的图片，通过 Nginx 提供静态服务）</code></pre>

<h2>PM2 命令</h2>
<pre><code class="language-bash">pm2 list                        # 查看运行中的进程
pm2 status devforge-portal      # 检查 Portal 状态
pm2 logs devforge-portal        # 查看日志
pm2 restart devforge-portal     # 修改后重启
pm2 stop devforge-portal        # 停止 Portal</code></pre>

<h2>Nginx 配置</h2>
<p>Portal 内部运行在 3000 端口。Nginx 将 80/443 端口代理到该端口，并从 <code>/data/devforge/uploads/</code> 提供静态文件服务。</p>

<h2>服务器环境变量</h2>
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
    titleKey: "docs.troubleshooting",
    content: `
<h1>故障排除</h1>

<h2>MCP 工具找不到</h2>
<p><strong>症状：</strong> Claude 提示找不到 <code>devforge_*</code> 工具或工具未出现。</p>
<p><strong>解决：</strong></p>
<ol>
  <li>在 Claude Code 中调用 <code>ToolSearch("devforge")</code> 加载工具</li>
  <li>如果仍然找不到，运行 <code>bash scripts/register-mcp.sh</code> 重新注册</li>
  <li>重启 Claude Code 并再次运行 <code>/devforge:init</code></li>
</ol>
<pre><code class="language-bash">bash scripts/register-mcp.sh
# 然后重启 Claude Code</code></pre>

<h2>图片无法显示</h2>
<p><strong>症状：</strong> 反馈中的图片显示为破损图标。</p>
<p><strong>解决：</strong> Dashboard 需要在相对路径前加上服务器域名：</p>
<pre><code class="language-text">错误：  /uploads/image.png
正确：  https://forge.wdao.chat/uploads/image.png</code></pre>
<p>检查 <code>.env.local</code> 中的 <code>DEVFORGE_SERVER_URL</code>，确保使用 <code>https://</code>。</p>
<p>在服务器上验证上传目录权限：</p>
<pre><code class="language-bash">ssh root@106.54.19.137 "ls -la /data/devforge/uploads/"
# 需要对 nginx 用户可读</code></pre>

<h2>同步失败</h2>
<p><strong>症状：</strong> Push/Pull 返回错误或超时。</p>
<p><strong>排查清单：</strong></p>
<ol>
  <li>确认 <code>DEVFORGE_SERVER_URL</code> 使用 <code>https://</code>（不是 http）</li>
  <li>检查同步密钥与服务器配置是否一致</li>
  <li>测试服务器连通性：<code>curl https://forge.wdao.chat/api/sync/status</code></li>
  <li>查看服务器 PM2 日志：<code>ssh root@106.54.19.137 "pm2 logs devforge-portal --lines 50"</code></li>
</ol>

<h2>Plugin 命令不显示</h2>
<p><strong>症状：</strong> <code>/devforge:init</code> 等斜杠命令没有出现在自动补全中。</p>
<p><strong>解决：</strong></p>
<ul>
  <li>部分命令名可能与 Claude 内置命令冲突</li>
  <li>直接输入完整命令名然后回车 — 即使没有自动补全也能生效</li>
  <li>检查 Plugin 安装：<code>ls ~/.claude/plugins/cache/devforge/</code></li>
</ul>

<h2>Hydration 错误（Next.js）</h2>
<p><strong>症状：</strong> 控制台显示 hydration mismatch 错误，页面渲染异常。</p>
<p><strong>解决：</strong> 清除 Next.js 缓存：</p>
<pre><code class="language-bash">rm -rf .next
npm run dev</code></pre>

<h2>数据库错误</h2>
<p><strong>症状：</strong> SQL 错误、缺少表或数据损坏。</p>
<pre><code class="language-bash"># 重新运行迁移
npx drizzle-kit push

# 检查数据库
sqlite3 ~/.devforge/devforge.db ".tables"

# 备份并重置（最后手段）
cp ~/.devforge/devforge.db ~/.devforge/devforge.db.bak
npx drizzle-kit push --force</code></pre>

<h2>端口 3102 被占用</h2>
<pre><code class="language-bash">lsof -i :3102
kill -9 &lt;PID&gt;
npm run dev</code></pre>

<h2>MCP Server 启动失败</h2>
<pre><code class="language-bash"># 手动测试 MCP Server
bash mcp-server/start.sh

# 检查语法错误
node mcp-server/index.js

# 重新注册
bash scripts/register-mcp.sh</code></pre>

<h2>获取帮助</h2>
<p>在同步页面（<a href="/sync">Dashboard → Sync</a>）查看最近的同步错误日志。同步日志会显示最近 20 次操作的时间戳和错误信息。</p>
    `,
  },
  {
    slug: "faq",
    title: "FAQ",
    titleKey: "docs.faq",
    content: `
<h1>常见问题</h1>

<h2>基础问题</h2>

<h3>Q：Dashboard 和 Portal 共用同一个数据库吗？</h3>
<p><strong>A：</strong>不是。Dashboard 使用本地 SQLite 文件（<code>~/.devforge/devforge.db</code>），Portal 使用服务器端 SQLite 文件（<code>/opt/devforge-portal/devforge.db</code>）。它们通过 Push/Pull API 保持同步。</p>

<h3>Q：上传的图片存储在哪里？</h3>
<p><strong>A：</strong>存储在服务器的 <code>/data/devforge/uploads/</code> 目录，通过 Nginx 以静态文件方式提供。Dashboard 上传的图片也会发送到服务器（而非本地磁盘），以便 Portal 能够显示。</p>

<h3>Q：如何把项目添加到 Portal？</h3>
<p><strong>A：</strong>在 Dashboard 中打开项目，将 <code>is_public</code> 设为 true，保存后执行 sync push。项目就会出现在 forge.wdao.chat 上。</p>

<h3>Q：不用 Portal 可以使用 DevForge 吗？</h3>
<p><strong>A：</strong>可以。Dashboard 和 MCP 工具完全在本地运行。Portal 是可选的 — 没有服务器时同步功能无法使用，但其他功能不受影响。</p>

<h2>MCP 与集成</h2>

<h3>Q：为什么每次会话都需要运行 /devforge:init？</h3>
<p><strong>A：</strong>Claude Code 不会在对话之间保持工具状态。<code>/devforge:init</code> 会加载当前目录的项目上下文并激活该会话的 MCP 工具。</p>

<h3>Q：Claude 可以不经询问就使用 DevForge 工具吗？</h3>
<p><strong>A：</strong>可以，而且应该这样。根据 <code>CLAUDE.md</code> 的配置，Claude 会主动记录 bug、设计决策和会话总结，无需手动触发。这是预期的工作流程。</p>

<h3>Q：DevForge 能追踪多少个仓库？</h3>
<p><strong>A：</strong>本地无限制。Dashboard 目前追踪 93+ 个仓库。由于本地 SQLite 数据库处理高效，性能表现良好。Portal 只显示公开项目。</p>

<h2>数据与同步</h2>

<h3>Q：本地删除项目后 Push 会怎样？</h3>
<p><strong>A：</strong>Push API 会将该项目从服务器上移除。与该项目关联的所有 Issue、笔记和反馈也会从服务器上删除。</p>

<h3>Q：自动同步多久运行一次？</h3>
<p><strong>A：</strong>Auto-push 在每次 MCP 写操作后立即执行（无延迟）。Auto-pull 在打开反馈页面时执行，之后每 60 秒轮询一次。Push 没有后台轮询。</p>

<h3>Q：同步安全吗？</h3>
<p><strong>A：</strong>同步通过请求头中的共享密钥（<code>x-sync-secret</code>）认证。管理员回复使用独立的 <code>x-owner-secret</code>。这些都是环境变量 — 切勿提交到 Git。</p>

<h2>开发相关</h2>

<h3>Q：如何同时在本地运行 Dashboard 和 Portal？</h3>
<pre><code class="language-bash"># Dashboard（本项目）
npm run dev          # 运行在 :3102

# Portal（独立部署）
cd ~/Documents/DevForge  # Portal 代码
npm run dev              # 运行在 :3000</code></pre>

<h3>Q：可以为 DevForge 贡献代码吗？</h3>
<p><strong>A：</strong>DevForge 是个人工具，但代码开源。欢迎 Fork 并根据自己的需求进行修改。</p>

<h3>Q：Note 和 Issue 有什么区别？</h3>
<p><strong>A：</strong>Issue 是可执行的工作项，带有状态跟踪（open/in-progress/done）。Note 是自由格式的记录，用于设计决策、观察记录或会话总结 — 没有状态和优先级。</p>
    `,
  },
];

export function getDocSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.slug === slug);
}

export function getFirstSection(): DocSection {
  return DOC_SECTIONS[0];
}
