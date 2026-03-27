export interface DocSection {
  slug: string;
  title: string;
  titleKey: string;
  content: string;
  contentZh: string;
}

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    titleKey: "docs.gettingStarted",
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
    contentZh: `
<h1>快速开始</h1>

<h2>什么是 DevForge？</h2>
<p>DevForge 是一个全面的个人项目管理中心，通过 MCP Server 和 Plugin 系统与 Claude Code 深度集成。它追踪 90+ 个 git 仓库，提供项目管理、问题追踪和社区反馈功能。</p>

<h2>Dashboard vs Portal</h2>
<table>
  <thead><tr><th>Dashboard（localhost:3102）</th><th>Portal（forge.wdao.chat）</th></tr></thead>
  <tbody>
    <tr><td>完整读写 CRUD</td><td>只读展示</td></tr>
    <tr><td>管理 93+ 个项目</td><td>展示 8 个公开项目</td></tr>
    <tr><td>回复反馈（Owner）</td><td>提交反馈</td></tr>
    <tr><td>创建发布/里程碑</td><td>查看发布/里程碑</td></tr>
    <tr><td>编辑 Issue</td><td>投票/评论 Issue</td></tr>
    <tr><td>推送/拉取同步控制</td><td>被动接收数据</td></tr>
    <tr><td>本地 SQLite</td><td>服务器 SQLite</td></tr>
  </tbody>
</table>

<h2>安装</h2>
<pre><code class="language-bash">curl -fsSL https://raw.githubusercontent.com/xmqywx/DevForge/master/install.sh | bash</code></pre>

<h2>手动安装</h2>
<pre><code class="language-bash">git clone https://github.com/xmqywx/DevForge.git
cd DevForge
npm install
npx drizzle-kit push
bash scripts/register-mcp.sh</code></pre>

<h2>首次使用</h2>
<p>在 Claude Code 中运行 <code>/devforge:init</code> 来初始化并检测当前项目。DevForge 会自动扫描 git 仓库、加载项目上下文，并激活所有 MCP 工具。</p>

<h2>环境要求</h2>
<ul>
  <li>Node.js 18+</li>
  <li>Claude Code（需支持 MCP）</li>
  <li>主目录下的 Git 仓库</li>
</ul>
    `,
  },
  {
    slug: "slash-commands",
    title: "Slash Commands",
    titleKey: "docs.slashCommands",
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
    contentZh: `
<h1>斜杠命令</h1>

<p>斜杠命令在 Claude Code 对话中调用，通过 DevForge 插件系统触发 Claude 加载上下文并执行操作。</p>

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
      <td>查看项目状态 — 显示进度百分比、阶段、未解决问题</td>
      <td>快速检查当前项目健康状况</td>
    </tr>
    <tr>
      <td><code>/devforge:df-issues</code></td>
      <td>列出未解决问题 — 显示当前项目所有待处理和进行中的问题</td>
      <td>开始工作前选择下一个任务</td>
    </tr>
    <tr>
      <td><code>/devforge:df-add-issue</code></td>
      <td>添加新问题 — 创建带优先级的 bug、功能或任务</td>
      <td>会话中发现 bug 时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-note</code></td>
      <td>添加笔记 — 记录设计决策、架构说明或观察结果</td>
      <td>做出重要设计决策后</td>
    </tr>
    <tr>
      <td><code>/devforge:df-summary</code></td>
      <td>会话总结 — 自动分析对话并记录完成的工作</td>
      <td>每次工作会话结束时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-progress</code></td>
      <td>更新进度 — 设置完成百分比或更改项目阶段</td>
      <td>完成里程碑或阶段后</td>
    </tr>
    <tr>
      <td><code>/devforge:df-configure</code></td>
      <td>配置自动化 — 切换自动记录问题、笔记、会话总结</td>
      <td>自定义项目的 DevForge 行为</td>
    </tr>
    <tr>
      <td><code>/devforge:df-release</code></td>
      <td>创建发布 — 从最近的 git 提交自动生成更新日志</td>
      <td>发布新版本时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-sync</code></td>
      <td>同步数据 — 推送本地数据到服务器或拉取用户反馈</td>
      <td>修改后希望同步到 Portal 时</td>
    </tr>
    <tr>
      <td><code>/devforge:df-scan</code></td>
      <td>扫描 git 仓库 — 重新扫描配置路径以发现新仓库</td>
      <td>创建新项目后</td>
    </tr>
    <tr>
      <td><code>/devforge:open</code></td>
      <td>打开 Dashboard — 在浏览器中打开 localhost:3102</td>
      <td>查看 Dashboard UI</td>
    </tr>
  </tbody>
</table>

<h2>使用提示</h2>
<ul>
  <li>始终以 <code>/devforge:init</code> 开始会话以加载上下文</li>
  <li>命令区分大小写 — 使用如图所示的确切名称</li>
  <li>如果命令未出现在建议中，直接输入完整名称</li>
  <li>部分命令名称可能与 Claude 内置命令冲突 — 使用完整名称覆盖</li>
</ul>

<h2>自动记录规则</h2>
<p>根据 <code>CLAUDE.md</code>，Claude 应主动调用 MCP 工具，无需提示：</p>
<ul>
  <li>发现 bug → 立即调用 <code>devforge_add_issue</code></li>
  <li>用户反馈问题 → 立即调用 <code>devforge_add_issue</code></li>
  <li>修复问题 → 调用 <code>devforge_update_issue</code> 标记已解决</li>
  <li>做出设计决策 → 调用 <code>devforge_add_note</code></li>
  <li>会话结束 → 通过 <code>devforge_add_note</code> 总结</li>
</ul>
    `,
  },
  {
    slug: "mcp-tools",
    title: "MCP Tools",
    titleKey: "docs.mcpTools",
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
    contentZh: `
<h1>MCP 工具</h1>

<p>MCP（模型上下文协议）工具由 Claude Code 直接调用，与本地 SQLite 数据库和服务器 API 交互。</p>

<h2>工具参考</h2>

<table>
  <thead>
    <tr><th>工具</th><th>说明</th><th>主要参数</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>devforge_list_projects</code></td>
      <td>列出所有项目，可按阶段筛选</td>
      <td><code>stage?</code>（idea/active/shipped/archived）</td>
    </tr>
    <tr>
      <td><code>devforge_get_project</code></td>
      <td>获取项目完整详情，包括问题、笔记、发布</td>
      <td><code>slug</code>（必填）</td>
    </tr>
    <tr>
      <td><code>devforge_add_issue</code></td>
      <td>为项目创建新问题</td>
      <td><code>project_slug</code>, <code>title</code>, <code>type?</code>, <code>priority?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_issue</code></td>
      <td>更新问题状态、优先级或其他字段</td>
      <td><code>id</code>, <code>status?</code>, <code>priority?</code>, <code>title?</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_note</code></td>
      <td>添加笔记（设计决策、观察、会话总结）</td>
      <td><code>project_slug</code>, <code>title</code>, <code>content</code>, <code>type?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_progress</code></td>
      <td>更新项目进度百分比或阶段</td>
      <td><code>project_slug</code>, <code>progress_pct?</code>, <code>stage?</code>, <code>stage_text?</code></td>
    </tr>
    <tr>
      <td><code>devforge_get_feedback</code></td>
      <td>获取反馈条目，可按项目筛选</td>
      <td><code>project_slug?</code>, <code>status?</code></td>
    </tr>
    <tr>
      <td><code>devforge_scan</code></td>
      <td>扫描目录中的 git 仓库并更新项目列表</td>
      <td><code>paths?</code>（要扫描的目录路径数组）</td>
    </tr>
    <tr>
      <td><code>devforge_add_release</code></td>
      <td>创建带版本号和更新日志的新发布</td>
      <td><code>project_slug</code>, <code>version</code>, <code>title</code>, <code>content</code>, <code>date?</code></td>
    </tr>
    <tr>
      <td><code>devforge_add_milestone</code></td>
      <td>添加带日期和状态的项目里程碑</td>
      <td><code>project_slug</code>, <code>title</code>, <code>status</code>, <code>date</code>, <code>description?</code></td>
    </tr>
    <tr>
      <td><code>devforge_update_readme</code></td>
      <td>更新项目的 README 内容</td>
      <td><code>project_slug</code>, <code>content?</code>（省略则自动从文件读取）</td>
    </tr>
    <tr>
      <td><code>devforge_sync</code></td>
      <td>同步本地数据库与服务器数据</td>
      <td><code>direction?</code>（push/pull/both，默认 both）</td>
    </tr>
  </tbody>
</table>

<h2>工具加载</h2>
<p>如果 MCP 工具未出现，调用 <code>ToolSearch("devforge")</code> 来加载它们。这是 MCP 系统的已知特性 — 新对话中首次使用前必须先获取工具。</p>

<pre><code class="language-text">// In Claude Code, if tools are missing:
ToolSearch("devforge")
// Then use the tools normally</code></pre>

<h2>问题类型</h2>
<ul>
  <li><code>bug</code> — 有东西坏了</li>
  <li><code>feature</code> — 新功能</li>
  <li><code>task</code> — 工作项或杂务</li>
  <li><code>improvement</code> — 对现有功能的增强</li>
</ul>

<h2>问题优先级</h2>
<ul>
  <li><code>critical</code> — 阻塞一切，立即修复</li>
  <li><code>high</code> — 重要，尽快处理</li>
  <li><code>medium</code> — 正常优先级（默认）</li>
  <li><code>low</code> — 有则更好</li>
</ul>

<h2>问题状态</h2>
<ul>
  <li><code>open</code> — 未开始</li>
  <li><code>in-progress</code> — 正在处理</li>
  <li><code>in-review</code> — 代码已写，待审查</li>
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
    contentZh: `
<h1>CLI 命令</h1>

<p><code>devforge</code> CLI 提供终端访问 DevForge 功能的方式，适用于脚本编写、不打开 Claude Code 的快速操作或自动化。</p>

<h2>安装</h2>
<p>CLI 由安装脚本自动安装。安装后，<code>devforge</code> 命令全局可用。</p>

<pre><code class="language-bash"># Verify installation
devforge --version

# Get help
devforge --help</code></pre>

<h2>命令</h2>

<h3>status</h3>
<pre><code class="language-bash">devforge status [project-slug]

# Examples:
devforge status                  # Global overview
devforge status my-agent         # Status for specific project</code></pre>
<p>显示项目进度、阶段、未解决问题数量和最近活动。</p>

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
<p>扫描目录中的 git 仓库并更新项目数据库。</p>

<h3>sync</h3>
<pre><code class="language-bash">devforge sync [direction]

# Directions: push | pull | both (default: both)

# Examples:
devforge sync           # Bidirectional sync
devforge sync push      # Push local data to server
devforge sync pull      # Pull feedback from server</code></pre>

<h3>open</h3>
<pre><code class="language-bash">devforge open           # Opens localhost:3102 in default browser</code></pre>

<h2>退出码</h2>
<ul>
  <li><code>0</code> — 成功</li>
  <li><code>1</code> — 通用错误</li>
  <li><code>2</code> — 未找到（项目、问题等）</li>
  <li><code>3</code> — 网络错误（同步失败）</li>
</ul>
    `,
  },
  {
    slug: "bash-scripts",
    title: "Bash Scripts",
    titleKey: "docs.bashScripts",
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
    contentZh: `
<h1>Bash 脚本</h1>

<p><code>scripts/</code> 目录包含常用操作的工具脚本，是 CLI 命令的底层替代方案。</p>

<h2>scripts/status.sh</h2>
<pre><code class="language-bash">bash scripts/status.sh [project-slug]</code></pre>
<p>打印所有项目或特定项目的摘要 — 阶段、进度、未解决问题、最近提交日期。</p>

<h2>scripts/next-issue.sh</h2>
<pre><code class="language-bash">bash scripts/next-issue.sh &lt;project-slug&gt;

# Example:
bash scripts/next-issue.sh my-agent</code></pre>
<p>返回没有阻塞依赖的最高优先级未解决问题，帮助快速决定下一步工作内容。</p>

<h2>scripts/blocked.sh</h2>
<pre><code class="language-bash">bash scripts/blocked.sh &lt;project-slug&gt;

# Example:
bash scripts/blocked.sh devforge</code></pre>
<p>列出所有被阻塞的问题（有未解决的依赖），显示阻塞链条以便优先解决阻塞项。</p>

<h2>scripts/sync.ts</h2>
<pre><code class="language-bash">npx tsx scripts/sync.ts [push|pull|both]

# Examples:
npx tsx scripts/sync.ts push   # Push to server
npx tsx scripts/sync.ts pull   # Pull feedback
npx tsx scripts/sync.ts both   # Full bidirectional sync (default)</code></pre>
<p>TypeScript 同步脚本。处理推送（项目、问题、笔记、发布、里程碑 → 服务器）和拉取（反馈、投票、评论 → 本地）。</p>

<h2>scripts/register-mcp.sh</h2>
<pre><code class="language-bash">bash scripts/register-mcp.sh</code></pre>
<p>在 <code>~/.claude.json</code> 中注册 DevForge MCP 服务器。初始安装后或 MCP 工具停止出现时运行。</p>

<h2>在 CI / 自动化中使用</h2>
<pre><code class="language-bash"># Example: automated sync after deploy
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
    contentZh: `
<h1>同步机制</h1>

<p>DevForge 使用单向同步模型保持本地 Dashboard 和远程 Portal 的同步。</p>

<h2>架构</h2>

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

<h2>推送（本地 → 服务器）</h2>
<p>推送将本地数据发送到 Portal 服务器。只有<em>公开</em>项目会同步到 Portal。</p>
<ul>
  <li><strong>项目</strong> — 仅 <code>is_public = true</code> 的项目</li>
  <li><strong>问题</strong> — 公开项目的所有问题</li>
  <li><strong>笔记</strong> — 公开项目的所有笔记</li>
  <li><strong>发布</strong> — 公开项目的所有发布</li>
  <li><strong>里程碑</strong> — 公开项目的所有里程碑</li>
</ul>

<pre><code class="language-bash"># Manual push
devforge sync push
# or
npx tsx scripts/sync.ts push</code></pre>

<h2>拉取（服务器 → 本地）</h2>
<p>拉取从 Portal 服务器获取用户生成的内容。</p>
<ul>
  <li><strong>反馈</strong> — Portal 上的用户提交</li>
  <li><strong>回复</strong> — 反馈线程上的评论</li>
  <li><strong>投票</strong> — 反馈和问题的点赞</li>
</ul>

<pre><code class="language-bash"># Manual pull
devforge sync pull
# or
npx tsx scripts/sync.ts pull</code></pre>

<h2>自动同步</h2>
<p>自动同步在两种情况下触发：</p>
<ol>
  <li><strong>每次 MCP 写操作后</strong> — 调用 <code>devforge_add_issue</code>、<code>devforge_add_note</code>、<code>devforge_update_issue</code> 等都会自动触发推送</li>
  <li><strong>打开反馈页面时</strong> — 反馈页面在加载时自动拉取，并每 60 秒轮询一次</li>
</ol>

<h2>同步 API 端点</h2>
<pre><code class="language-text">POST https://forge.wdao.chat/api/sync/push
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Body: { projects, issues, notes, releases, milestones }

GET  https://forge.wdao.chat/api/sync/pull
  Headers: x-sync-secret: &lt;DEVFORGE_SYNC_SECRET&gt;
  Returns: { feedback, replies, votes }</code></pre>

<h2>配置</h2>
<p>在 <code>.env.local</code> 中：</p>
<pre><code class="language-bash">DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_SYNC_SECRET=your-sync-secret
DEVFORGE_OWNER_SECRET=devforge-owner-2026</code></pre>

<h2>冲突解决</h2>
<p>DevForge 使用<em>最后写入获胜</em>策略。服务器是反馈/投票的真实来源，本地是项目数据的真实来源。</p>
    `,
  },
  {
    slug: "deploy-guide",
    title: "Deploy Guide",
    titleKey: "docs.deployGuide",
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
    contentZh: `
<h1>部署指南</h1>

<p>Portal（<code>forge.wdao.chat</code>）部署在 Linux VPS 上，使用 rsync + PM2。没有 GitHub Actions 流水线 — 通过 SSH 手动部署。</p>

<h2>部署步骤</h2>

<h3>步骤 1：rsync 源代码到服务器</h3>
<pre><code class="language-bash">rsync -avz \\
  --exclude node_modules \\
  --exclude .next \\
  --exclude .git \\
  --exclude .env.local \\
  --exclude devforge.db \\
  -e ssh \\
  . root@106.54.19.137:/opt/devforge-portal/</code></pre>

<h3>步骤 2：在服务器上构建并重启</h3>
<pre><code class="language-bash">ssh root@106.54.19.137 "cd /opt/devforge-portal && npm install && rm -rf .next && npm run build && pm2 restart devforge-portal"</code></pre>

<h3>步骤 3：同步数据</h3>
<pre><code class="language-bash">npx tsx scripts/sync.ts push</code></pre>

<h2>完整部署脚本</h2>
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

<h2>服务器目录结构</h2>
<pre><code class="language-text">/opt/devforge-portal/
├── src/
├── .next/          (built output)
├── .env.local      (server env vars)
├── devforge.db     (server SQLite)
└── package.json

/data/devforge/
└── uploads/        (user-uploaded images, served via Nginx)</code></pre>

<h2>PM2 命令</h2>
<pre><code class="language-bash">pm2 list                        # View running processes
pm2 status devforge-portal      # Check portal status
pm2 logs devforge-portal        # View logs
pm2 restart devforge-portal     # Restart after changes
pm2 stop devforge-portal        # Stop the portal</code></pre>

<h2>Nginx 配置</h2>
<p>Portal 内部运行在 3000 端口。Nginx 将 80/443 端口代理到该端口，并从 <code>/data/devforge/uploads/</code> 提供静态文件。</p>

<h2>环境变量（服务器）</h2>
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
    contentZh: `
<h1>故障排除</h1>

<h2>MCP 工具未找到</h2>
<p><strong>现象：</strong>Claude 提示找不到 <code>devforge_*</code> 工具或工具未出现。</p>
<p><strong>修复：</strong></p>
<ol>
  <li>在 Claude Code 中调用 <code>ToolSearch("devforge")</code> 加载工具</li>
  <li>如果仍然缺失，运行 <code>bash scripts/register-mcp.sh</code> 重新注册</li>
  <li>重启 Claude Code 并再次运行 <code>/devforge:init</code></li>
</ol>
<pre><code class="language-bash">bash scripts/register-mcp.sh
# Then restart Claude Code</code></pre>

<h2>图片不显示</h2>
<p><strong>现象：</strong>反馈图片显示为损坏的图片图标。</p>
<p><strong>修复：</strong>Dashboard 需要为相对图片 URL 添加服务器域名前缀：</p>
<pre><code class="language-text">Wrong:   /uploads/image.png
Correct: https://forge.wdao.chat/uploads/image.png</code></pre>
<p>检查 <code>.env.local</code> 中的 <code>DEVFORGE_SERVER_URL</code>，确保使用 <code>https://</code>。</p>
<p>在服务器上验证上传目录权限：</p>
<pre><code class="language-bash">ssh root@106.54.19.137 "ls -la /data/devforge/uploads/"
# Should be readable by nginx user</code></pre>

<h2>同步失败</h2>
<p><strong>现象：</strong>推送/拉取返回错误或超时。</p>
<p><strong>检查清单：</strong></p>
<ol>
  <li>确认 <code>DEVFORGE_SERVER_URL</code> 使用 <code>https://</code>（不是 http）</li>
  <li>检查同步密钥是否与服务器配置匹配</li>
  <li>测试服务器连接：<code>curl https://forge.wdao.chat/api/sync/status</code></li>
  <li>检查服务器上的 PM2 日志：<code>ssh root@106.54.19.137 "pm2 logs devforge-portal --lines 50"</code></li>
</ol>

<h2>插件命令不显示</h2>
<p><strong>现象：</strong>斜杠命令如 <code>/devforge:init</code> 未出现在建议中。</p>
<p><strong>修复：</strong></p>
<ul>
  <li>部分命令名称与 Claude 内置命令冲突</li>
  <li>直接输入完整命令名称并按 Enter — 即使没有自动补全也会生效</li>
  <li>检查插件安装：<code>ls ~/.claude/plugins/cache/devforge/</code></li>
</ul>

<h2>Hydration 错误（Next.js）</h2>
<p><strong>现象：</strong>控制台显示 hydration 不匹配错误，页面渲染不正确。</p>
<p><strong>修复：</strong>清除 Next.js 缓存：</p>
<pre><code class="language-bash">rm -rf .next
npm run dev</code></pre>

<h2>数据库错误</h2>
<p><strong>现象：</strong>SQL 错误、缺少表或数据损坏。</p>
<pre><code class="language-bash"># Re-run migrations
npx drizzle-kit push

# Check database
sqlite3 ~/.devforge/devforge.db ".tables"

# Backup and reset (last resort)
cp ~/.devforge/devforge.db ~/.devforge/devforge.db.bak
npx drizzle-kit push --force</code></pre>

<h2>3102 端口被占用</h2>
<pre><code class="language-bash">lsof -i :3102
kill -9 &lt;PID&gt;
npm run dev</code></pre>

<h2>MCP 服务器启动失败</h2>
<pre><code class="language-bash"># Test MCP server manually
bash mcp-server/start.sh

# Check for syntax errors
node mcp-server/index.js

# Re-register
bash scripts/register-mcp.sh</code></pre>

<h2>获取帮助</h2>
<p>查看同步页面（<a href="/sync">Dashboard → 同步</a>）的日志以获取最近的同步错误。同步日志显示最近 20 次操作的时间戳和错误信息。</p>
    `,
  },
  {
    slug: "faq",
    title: "FAQ",
    titleKey: "docs.faq",
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
    contentZh: `
<h1>常见问题</h1>

<h2>通用</h2>

<h3>Q：Dashboard 和 Portal 共享同一个数据库吗？</h3>
<p><strong>A：</strong>不。Dashboard 使用本地 SQLite 文件（<code>~/.devforge/devforge.db</code>），Portal 使用服务器端 SQLite 文件（<code>/opt/devforge-portal/devforge.db</code>）。它们通过推送/拉取 API 保持同步。</p>

<h3>Q：上传的图片存储在哪里？</h3>
<p><strong>A：</strong>存储在服务器的 <code>/data/devforge/uploads/</code>，由 Nginx 作为静态文件提供。Dashboard 的图片上传也发送到服务器（不是本地磁盘），以便 Portal 可以显示。</p>

<h3>Q：如何将新项目添加到 Portal？</h3>
<p><strong>A：</strong>在 Dashboard 中，进入项目，打开该项目，将 <code>is_public = true</code>，保存，然后推送同步。该项目将出现在 forge.wdao.chat 上。</p>

<h3>Q：可以不用 Portal 单独使用 DevForge 吗？</h3>
<p><strong>A：</strong>可以。Dashboard 和 MCP 工具完全在本地工作。Portal 是可选的 — 没有服务器时同步功能不会工作。</p>

<h2>MCP 与集成</h2>

<h3>Q：为什么每次会话开始都需要运行 /devforge:init？</h3>
<p><strong>A：</strong>Claude Code 不会在对话之间保留工具状态。<code>/devforge:init</code> 为当前目录加载项目上下文，并为该会话激活 MCP 工具。</p>

<h3>Q：Claude 能在不被要求的情况下使用 DevForge 工具吗？</h3>
<p><strong>A：</strong>可以，而且应该这样做。根据 <code>CLAUDE.md</code>，Claude 被配置为在没有提示的情况下主动记录 bug、决策和会话摘要。这是预期的工作流程。</p>

<h3>Q：DevForge 可以追踪多少个仓库？</h3>
<p><strong>A：</strong>本地无限制。Dashboard 目前追踪 93+ 个仓库，性能依然良好，因为本地 SQLite 数据库能高效处理。Portal 只显示公开项目。</p>

<h2>数据与同步</h2>

<h3>Q：如果我在本地删除项目然后推送会发生什么？</h3>
<p><strong>A：</strong>推送 API 将从服务器删除该项目。与该项目关联的所有问题、笔记和反馈也将从服务器删除。</p>

<h3>Q：自动同步多久运行一次？</h3>
<p><strong>A：</strong>自动推送在每次 MCP 写操作后立即运行（无延迟）。自动拉取在打开反馈页面时运行，并在页面打开时每 60 秒轮询一次。推送没有后台轮询。</p>

<h3>Q：同步安全吗？</h3>
<p><strong>A：</strong>同步在请求头中使用共享密钥（<code>x-sync-secret</code>）。Owner 回复使用单独的 <code>x-owner-secret</code>。这些是环境变量 — 永远不要提交到 git。</p>

<h2>开发</h2>

<h3>Q：如何在本地同时运行 Dashboard 和 Portal？</h3>
<pre><code class="language-bash"># Dashboard (this app)
npm run dev          # runs on :3102

# Portal (separate repo)
cd ~/Documents/DevForge  # Portal code
npm run dev              # runs on :3000</code></pre>

<h3>Q：可以为 DevForge 做贡献吗？</h3>
<p><strong>A：</strong>DevForge 是个人工具，但代码是开源的。欢迎 fork 并根据自己的项目进行改造。</p>

<h3>Q：笔记和问题有什么区别？</h3>
<p><strong>A：</strong>问题是有状态跟踪的可操作工作项（待处理/进行中/已完成）。笔记是决策、观察或会话摘要的自由格式记录 — 没有状态或优先级。</p>
    `,
  },
];

export function getDocSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.slug === slug);
}

export function getFirstSection(): DocSection {
  return DOC_SECTIONS[0];
}
