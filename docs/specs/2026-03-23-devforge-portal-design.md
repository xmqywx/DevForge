# DevForge Portal — Public Project Showcase & Feedback

## Overview

DevForge Portal 是 DevForge 的公开面，部署在 106.54.19.137 上。它是一个独立的 Next.js 项目，作为个人技术品牌官网 + 项目展示 + 实时反馈系统。

**与 DevForge 的关系**：Portal 通过 API 与 DevForge 通信（或直接读同一个 PostgreSQL 数据库），不是同一个项目。

## Design System

- 浅色主题：#f0f0e8 背景，白色卡片 rounded-2xl shadow-sm
- 强调色：#c6e135 lime green
- 薄荷绿：#d1ede0 信息区域
- 使用 lucide-react 图标，NO emojis
- 参考 animate-ui 做入场/悬浮动画

## Tech Stack

- Next.js 15 (App Router)
- TailwindCSS 4 + shadcn/ui
- animate-ui + Motion
- Drizzle ORM + PostgreSQL (production)
- Nodemailer (通知)

## Pages

### 1. Home (/) — 个人主页

像一个精美的个人官网：
- Hero 区域：名字 + 一句话定位 + 头像/图标
- "What I'm Building" 区域：当前活跃项目卡片（2-3个重点项目）
- "Achievements" 区域：技术成就/里程碑
- "Tech Stack" 区域：技术栈图标展示
- "Areas of Focus" 区域：AI Agent / 跨境电商 / 开发者工具 等
- Footer：GitHub / 联系方式

### 2. Projects (/projects) — 项目列表

- 精美的项目卡片网格
- 每个卡片：项目名 + 描述 + 阶段标签 + 技术标签 + 进度
- 点击进入项目详情

### 3. Project Detail (/projects/[slug]) — 单项目页面

每个项目一个完整的详情页：
- Hero：项目名 + 描述 + 官网链接 + GitHub 链接
- "About" 区域：项目详细介绍（Markdown 渲染）
- "Roadmap" 区域：时间线形式，不显示具体时分秒
  - Planned → In Progress → Completed
  - 每个条目显示标题 + 简短描述
- "Recent Updates" 区域：最近修复的问题和新功能
  - 只显示日期（如"3月15日"），不要时分秒
- "Feedback" 区域：聊天式反馈（见下方详细设计）

### 4. Feedback — 聊天式对话

**不是传统的 issue 列表，而是像聊天一样**：

```
┌─────────────────────────────────────┐
│  Feedback for MyAgent               │
├─────────────────────────────────────┤
│                                     │
│  [随机头像] Alex  ·  3月15日         │
│  ┌─────────────────────────────┐    │
│  │ 能不能加一个暗色模式？        │    │
│  └─────────────────────────────┘    │
│  👍 12                              │
│                                     │
│        [特殊头像/标记] Ying (Owner) │
│        ┌─────────────────────────┐  │
│        │ 好的！已经加入 Roadmap。  │  │
│        │ 预计下个版本会支持。      │  │
│        └─────────────────────────┘  │
│                                     │
│  [随机头像] 匿名  ·  3月18日        │
│  ┌─────────────────────────────┐    │
│  │ 搜索功能有时候会卡住          │    │
│  │ [截图.png]                   │    │
│  └─────────────────────────────┘    │
│  👍 5                               │
│                                     │
│        [特殊头像/标记] Ying (Owner) │
│        ┌─────────────────────────┐  │
│        │ 已修复，请更新到最新版本。│  │
│        │ Status: ✅ Resolved      │  │
│        └─────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [输入框] Leave feedback...   [Send]│
│  📎 Attach  |  Your name (optional) │
└─────────────────────────────────────┘
```

**关键设计**：
- 普通用户：随机生成 avatar（用 DiceBear 或类似服务，基于 IP hash）
- Owner (你)：特殊头像 + "Owner" 标记 + 消息靠右显示（像微信）
- 每条 feedback 可以有多条回复（replies），形成对话
- 投票按钮在每条 feedback 下
- 图片内联显示
- 日期只显示到日（3月15日），不显示时分秒

### 5. Database 扩展

feedback 表需要增加 `replies` 支持：

```sql
CREATE TABLE feedback_replies (
  id INTEGER PRIMARY KEY,
  feedback_id INTEGER REFERENCES feedback(id),
  author_name TEXT DEFAULT '匿名',
  author_ip TEXT,
  is_owner BOOLEAN DEFAULT false,   -- Owner 回复标记
  content TEXT,
  images TEXT,  -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 6. DevForge 端实时通知

DevForge Private Dashboard 的 feedback-admin 页面：
- 实时显示新 feedback（轮询或 WebSocket）
- 可以直接在 Dashboard 里回复（回复自动标记 is_owner=true）
- 回复内容实时出现在 Portal 上

## Project Structure

```
devforge-portal/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home 个人主页
│   │   ├── projects/
│   │   │   ├── page.tsx          # 项目列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 项目详情 + Roadmap + Feedback
│   │   ├── api/
│   │   │   ├── feedback/         # Feedback CRUD
│   │   │   └── upload/           # 图片上传
│   │   └── layout.tsx            # 全局 layout
│   ├── components/
│   │   ├── hero.tsx
│   │   ├── project-card.tsx
│   │   ├── roadmap-timeline.tsx
│   │   ├── chat-feedback.tsx     # 聊天式反馈组件
│   │   ├── chat-message.tsx      # 单条消息
│   │   ├── chat-input.tsx        # 输入框
│   │   ├── vote-button.tsx
│   │   └── avatar.tsx            # 随机头像生成
│   ├── db/
│   │   ├── schema.ts             # 复用 DevForge schema + feedback_replies
│   │   └── client.ts
│   └── lib/
│       ├── anti-spam.ts
│       ├── upload.ts
│       └── email.ts
├── deploy/
│   ├── nginx.conf
│   └── ecosystem.config.js
└── package.json
```
