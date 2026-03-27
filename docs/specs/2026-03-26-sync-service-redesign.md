# DevForge Sync Service — 独立模块重构设计

## 目标

将同步功能从散落在各处的代码中抽离为一个**独立、可配置、可复用的模块**，解决 ID 冲突、数据所有权不清、同步路径混乱等问题。同时让服务器地址可配置，支持任何用户自托管。

## 核心原则

1. **UUID 替代自增 ID** — 消除 ID 冲突
2. **明确数据所有权** — 每张表明确谁是 Master
3. **服务器可配置** — 不硬编码域名，支持自托管
4. **独立模块** — sync 逻辑集中在一个包里，不散落在 API routes / MCP / hooks 各处
5. **幂等同步** — 重复 push/pull 不产生副作用
6. **服务器可随时重建** — 全量 push 即可恢复

## 架构

```
devforge/
├── packages/
│   └── sync/                    ← 独立 sync 模块
│       ├── index.ts             ← 主入口
│       ├── config.ts            ← 配置管理
│       ├── push.ts              ← 本地 → 服务器
│       ├── pull.ts              ← 服务器 → 本地
│       ├── status.ts            ← 同步状态
│       ├── uuid.ts              ← UUID 生成
│       └── types.ts             ← 类型定义
```

## 配置系统

### 配置文件: `~/.devforge/config.json`

```json
{
  "server": {
    "url": "https://forge.wdao.chat",
    "syncSecret": "your-sync-secret",
    "ownerSecret": "your-owner-secret",
    "enabled": true
  },
  "sync": {
    "autoPushOnWrite": true,
    "autoPullOnWsEvent": true,
    "pullIntervalSeconds": 0,
    "pushDebounceMs": 2000
  },
  "notifications": {
    "feishuWebhook": "https://open.feishu.cn/...",
    "email": null
  }
}
```

### 环境变量覆盖（优先级更高）

```
DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_SYNC_SECRET=xxx
DEVFORGE_OWNER_SECRET=xxx
DEVFORGE_FEISHU_WEBHOOK=xxx
```

### 配置读取逻辑

```typescript
// packages/sync/config.ts
export function getConfig(): SyncConfig {
  // 1. 读 ~/.devforge/config.json
  // 2. 环境变量覆盖
  // 3. .env.local 覆盖
  // 返回合并后的配置
}
```

### 首次配置流程（/devforge:init）

```
/devforge:init
  → 检测是否有 config.json
  → 没有 → 交互式配置向导：
    - 服务器 URL（可选，留空=不启用远程同步）
    - Sync Secret
    - Owner Secret
    - 飞书 Webhook（可选）
  → 生成 ~/.devforge/config.json
```

## UUID 迁移

### 所有表的 ID 改为 UUID

```sql
-- 旧
id INTEGER PRIMARY KEY AUTOINCREMENT

-- 新
id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))))
```

或者在应用层生成：

```typescript
// packages/sync/uuid.ts
import { randomUUID } from "crypto";
export const newId = () => randomUUID();
```

### 迁移脚本

```typescript
// scripts/migrate-to-uuid.ts
// 1. 导出所有表数据
// 2. 创建新表（UUID 主键）
// 3. 为每行生成 UUID，保存旧 ID → 新 UUID 映射
// 4. 更新所有外键引用
// 5. 删除旧表，重命名新表
```

## 数据所有权

```typescript
// packages/sync/types.ts

// 本地是 Master：push 时全量替换服务器数据
type LocalMaster = "projects" | "issues" | "notes" | "releases" | "milestones" | "git_snapshots";

// 服务器是 Master：pull 时合并到本地（不覆盖）
type ServerMaster = "feedback" | "feedback_replies" | "feedback_votes" | "issue_votes";

// 双向：按 updated_at 合并，Last-Write-Wins
type Bidirectional = "issue_comments";
```

## Sync Service API

```typescript
// packages/sync/index.ts

import { getConfig } from "./config";
import { pushToServer } from "./push";
import { pullFromServer } from "./pull";
import { getSyncStatus } from "./status";

export class SyncService {
  private config: SyncConfig;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SyncConfig>) {
    this.config = { ...getConfig(), ...config };
  }

  // Push local-master data to server
  async push(): Promise<PushResult> {
    if (!this.config.server.enabled) return { skipped: true };
    return pushToServer(this.config);
  }

  // Pull server-master data to local
  async pull(): Promise<PullResult> {
    if (!this.config.server.enabled) return { skipped: true };
    return pullFromServer(this.config);
  }

  // Bidirectional sync
  async sync(): Promise<{ push: PushResult; pull: PullResult }> {
    const pushResult = await this.push();
    const pullResult = await this.pull();
    return { push: pushResult, pull: pullResult };
  }

  // Debounced push (for auto-push after writes)
  debouncedPush() {
    if (!this.config.sync.autoPushOnWrite) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.push(), this.config.sync.pushDebounceMs);
  }

  // Get sync status
  status(): SyncStatus {
    return getSyncStatus();
  }

  // Full rebuild: clear server + push everything
  async rebuild(): Promise<PushResult> {
    // POST server/api/sync/rebuild (clears all server data)
    // Then full push
  }
}

// Singleton for use across the app
let _instance: SyncService | null = null;
export function getSyncService(): SyncService {
  if (!_instance) _instance = new SyncService();
  return _instance;
}
```

## Push 逻辑

```typescript
// packages/sync/push.ts

export async function pushToServer(config: SyncConfig): Promise<PushResult> {
  const { url, syncSecret } = config.server;

  // 1. 读取所有 local-master 表（只推 is_public=true 的项目及关联数据）
  const data = {
    projects: db.select().from(projects).where(eq(projects.isPublic, true)).all(),
    // ... 关联的 issues, notes, releases, milestones, git_snapshots
  };

  // 2. POST 到服务器 sync API
  const res = await fetch(`${url}/api/sync/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": syncSecret,
    },
    body: JSON.stringify(data),
  });

  // 3. 记录同步状态
  saveSyncStatus("push", new Date(), res.ok);

  return await res.json();
}
```

## Pull 逻辑

```typescript
// packages/sync/pull.ts

export async function pullFromServer(config: SyncConfig): Promise<PullResult> {
  const { url, syncSecret } = config.server;

  // 1. GET 服务器的 server-master 数据
  const res = await fetch(`${url}/api/sync/pull`, {
    headers: { "x-sync-secret": syncSecret },
  });
  const data = await res.json();

  // 2. 合并到本地
  //    - feedback: 按 UUID 匹配，不存在则 INSERT
  //    - feedback_replies: 同上
  //    - issue_comments: 按 UUID 匹配，Last-Write-Wins

  let stats = { feedback: 0, replies: 0, votes: 0, comments: 0 };

  for (const fb of data.feedback ?? []) {
    const existing = db.select().from(feedback).where(eq(feedback.id, fb.id)).get();
    if (!existing) {
      db.insert(feedback).values(fb).run();
      stats.feedback++;
    }
    // UUID 相同 = 同一条数据，无需去重逻辑
  }

  // 3. 记录同步状态
  saveSyncStatus("pull", new Date(), true);

  return stats;
}
```

## 同步状态持久化

```typescript
// packages/sync/status.ts
// 存在 ~/.devforge/sync-status.json

interface SyncStatus {
  lastPush: string | null;     // ISO datetime
  lastPull: string | null;
  lastPushResult: "ok" | "error" | null;
  lastPullResult: "ok" | "error" | null;
  lastError: string | null;
  history: SyncLogEntry[];     // 最近 50 条
}
```

## 服务器端 Sync API

Portal 提供的 sync 端点：

```
POST /api/sync/push     — 接收本地数据，全量替换 local-master 表
GET  /api/sync/pull      — 返回 server-master 表数据
POST /api/sync/rebuild   — 清空所有数据（用于全量重建）
GET  /api/sync/status    — 返回服务器端数据统计
```

所有端点需要 `x-sync-secret` 认证。

## 集成点

### 1. MCP Tools

```typescript
// mcp-server/tools.ts
import { getSyncService } from "../packages/sync";

// 每个写操作后：
handler: async (args) => {
  // ... 写入本地 DB
  getSyncService().debouncedPush(); // 防抖 push
  return result;
}
```

### 2. Dashboard API Routes

```typescript
// src/app/api/issues/route.ts
import { getSyncService } from "@/packages/sync";

export async function POST(request: Request) {
  // ... 写入本地 DB
  getSyncService().debouncedPush();
  return Response.json(result);
}
```

### 3. WebSocket Listener

```typescript
// src/components/ws-listener.tsx
import { getSyncService } from "@/packages/sync";

// WS 事件 → pull
function handleEvent(event) {
  getSyncService().pull();
  // 刷新页面
}
```

### 4. CLI

```bash
devforge sync push          # 手动 push
devforge sync pull          # 手动 pull
devforge sync status        # 查看状态
devforge sync rebuild       # 全量重建服务器
devforge config set server.url https://my-server.com
devforge config set server.syncSecret xxx
devforge config show
```

## 对公开发布的影响

当 DevForge 作为公开 plugin 发布时：

```
用户安装 DevForge plugin
  → /devforge:init
  → 本地 SQLite 自动创建
  → 问：是否连接远程服务器？
    → 是 → 输入服务器 URL + secret → 保存到 config.json → 启用同步
    → 否 → 纯本地模式，不同步
```

**纯本地模式**也完全可用——管理项目、记录 issues、Claude 上下文加载，只是没有公开 Portal 和 feedback。

## 迁移步骤

1. 创建 `packages/sync/` 模块
2. 所有表 ID 迁移到 UUID
3. 创建 `~/.devforge/config.json` 配置系统
4. 重写 push/pull 逻辑（基于 UUID，无 ID 冲突）
5. 替换现有的散落 sync 调用为 `getSyncService()`
6. 更新 CLI / MCP / Dashboard / Portal 的 sync API
7. 迁移测试 + 验证
