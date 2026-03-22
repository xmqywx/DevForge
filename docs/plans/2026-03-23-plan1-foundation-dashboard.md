# DevForge Plan 1: Foundation + Dashboard + Scanner

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working local Dashboard that scans git repos and displays all personal projects with issues, notes, and git activity.

**Architecture:** Next.js 15 App Router with SQLite (Drizzle ORM) for persistence. Git scanner uses simple-git to auto-detect repos under ~/Documents. Dark theme with 56px icon sidebar layout.

**Tech Stack:** Next.js 15, TailwindCSS 4, shadcn/ui, Motion, ReactBits, Drizzle ORM, better-sqlite3, simple-git

**Spec:** `docs/specs/2026-03-23-devforge-design.md`

---

## File Structure

```
devforge/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── .env.local                    # DB_PATH, SCAN_PATHS
├── src/
│   ├── db/
│   │   ├── schema.ts             # Drizzle table definitions
│   │   ├── client.ts             # DB connection singleton
│   │   ├── migrate.ts            # Migration runner
│   │   └── seed.ts               # Seed from git scan
│   ├── lib/
│   │   ├── scanner.ts            # Git repo scanner
│   │   └── queries.ts            # Reusable DB queries (next-issue, blocked, etc.)
│   ├── app/
│   │   ├── layout.tsx            # Root layout with sidebar
│   │   ├── page.tsx              # Overview (redirect or dashboard home)
│   │   ├── api/
│   │   │   ├── projects/
│   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   └── [slug]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │   ├── issues/
│   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │   ├── notes/
│   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH, DELETE
│   │   │   └── scan/
│   │   │       └── route.ts          # POST (trigger scan)
│   │   ├── projects/
│   │   │   ├── page.tsx              # Project grid
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Project detail (tabs)
│   │   ├── issues/
│   │   │   └── page.tsx              # Cross-project issues
│   │   ├── timeline/
│   │   │   └── page.tsx              # Git activity timeline
│   │   └── settings/
│   │       └── page.tsx              # Settings page
│   └── components/
│       ├── sidebar.tsx               # 56px icon sidebar
│       ├── project-card.tsx          # Compact project card
│       ├── issue-list.tsx            # Issue list with filters
│       ├── issue-form.tsx            # Add/edit issue
│       ├── note-editor.tsx           # Markdown note editor
│       ├── progress-bar.tsx          # Gradient progress bar
│       ├── stage-badge.tsx           # Stage badge (idea/dev/beta/live/paused/archived)
│       ├── stats-card.tsx            # Stat number card
│       └── git-log.tsx              # Git commits list
```

---

## Chunk 1: Project Scaffolding + Database

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/ying/Documents/DevForge
npx create-next-app@latest web --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

Move contents from `web/` to project root (we want flat structure, not nested).

- [ ] **Step 2: Install dependencies**

```bash
npm install drizzle-orm better-sqlite3 simple-git
npm install -D drizzle-kit @types/better-sqlite3
npm install motion
# shadcn/ui
npx shadcn@latest init
```

- [ ] **Step 3: Configure TailwindCSS 4 dark theme**

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#0f172a",
        card: "#1e293b",
        surface: "#0f172a",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Create .env.local**

```
DB_PATH=~/.devforge/devforge.db
SCAN_PATHS=~/Documents
SCAN_EXCLUDE=node_modules,.git,vendor,dist,.next
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + TailwindCSS 4 + shadcn/ui"
```

---

### Task 2: Database schema with Drizzle ORM

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Write schema**

`src/db/schema.ts`:
```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").default(""),
  icon: text("icon").default("📦"),
  stage: text("stage", { enum: ["idea", "dev", "beta", "live", "paused", "archived"] }).default("idea"),
  progressPct: integer("progress_pct").default(0),
  progressPhase: text("progress_phase").default(""),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  repoPath: text("repo_path"),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  autoRecordIssues: text("auto_record_issues", { enum: ["on", "off", "default"] }).default("default"),
  autoRecordNotes: text("auto_record_notes", { enum: ["on", "off", "default"] }).default("default"),
  autoSessionSummary: text("auto_session_summary", { enum: ["on", "off", "default"] }).default("default"),
  autoLoadContext: text("auto_load_context", { enum: ["on", "off", "default"] }).default("default"),
  autoUpdateProgress: text("auto_update_progress", { enum: ["on", "off", "default"] }).default("default"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const issues = sqliteTable("issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  type: text("type", { enum: ["bug", "feature", "improvement", "question", "task", "note"] }).default("task"),
  status: text("status", { enum: ["open", "in-review", "in-progress", "resolved", "wont-fix", "deferred"] }).default("open"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  source: text("source", { enum: ["manual", "auto", "feedback"] }).default("manual"),
  feedbackId: integer("feedback_id"),
  dependsOn: text("depends_on", { mode: "json" }).$type<number[]>().default([]),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
  resolvedAt: text("resolved_at"),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  source: text("source", { enum: ["manual", "auto", "session-summary"] }).default("manual"),
  sessionId: text("session_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const gitSnapshots = sqliteTable("git_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  branch: text("branch"),
  lastCommitHash: text("last_commit_hash"),
  lastCommitMsg: text("last_commit_msg"),
  lastCommitDate: text("last_commit_date"),
  isDirty: integer("is_dirty", { mode: "boolean" }).default(false),
  ahead: integer("ahead").default(0),
  behind: integer("behind").default(0),
  totalCommits: integer("total_commits").default(0),
  scannedAt: text("scanned_at").default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }),
});
```

- [ ] **Step 2: Write DB client**

`src/db/client.ts`:
```typescript
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { homedir } from "os";

const dbPath = process.env.DB_PATH?.replace("~", homedir())
  ?? resolve(homedir(), ".devforge", "devforge.db");

const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Write Drizzle config**

`drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";
import { homedir } from "os";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH?.replace("~", homedir())
      ?? `${homedir()}/.devforge/devforge.db`,
  },
});
```

- [ ] **Step 4: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- [ ] **Step 5: Verify DB created**

```bash
ls -la ~/.devforge/devforge.db
sqlite3 ~/.devforge/devforge.db ".tables"
# Expected: git_snapshots issues notes projects settings
```

- [ ] **Step 6: Commit**

```bash
git add src/db/ drizzle.config.ts drizzle/ .env.local
git commit -m "feat: Drizzle ORM schema — projects, issues, notes, git_snapshots, settings"
```

---

### Task 3: Git repo scanner

**Files:**
- Create: `src/lib/scanner.ts`
- Create: `src/db/seed.ts`

- [ ] **Step 1: Write scanner**

`src/lib/scanner.ts`:
```typescript
import simpleGit from "simple-git";
import { readdirSync, statSync, existsSync } from "fs";
import { join, basename, resolve } from "path";
import { homedir } from "os";

export interface ScannedRepo {
  name: string;
  path: string;
  branch: string;
  lastCommitHash: string;
  lastCommitMsg: string;
  lastCommitDate: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  totalCommits: number;
  remoteUrl?: string;
}

const EXCLUDE = new Set(["node_modules", ".git", "vendor", "dist", ".next", "__pycache__"]);

export async function scanGitRepos(
  rootPaths: string[],
  maxDepth = 4
): Promise<ScannedRepo[]> {
  const repos: ScannedRepo[] = [];
  const visited = new Set<string>();

  async function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    const gitDir = join(dir, ".git");
    if (existsSync(gitDir)) {
      const realPath = resolve(dir);
      if (visited.has(realPath)) return;
      visited.add(realPath);

      try {
        const git = simpleGit(dir);
        const log = await git.log({ maxCount: 1 });
        const status = await git.status();
        const branch = status.current ?? "unknown";

        let ahead = 0, behind = 0;
        try {
          ahead = status.ahead;
          behind = status.behind;
        } catch {}

        let remoteUrl: string | undefined;
        try {
          const remotes = await git.getRemotes(true);
          remoteUrl = remotes.find(r => r.name === "origin")?.refs?.fetch;
        } catch {}

        const totalLog = await git.raw(["rev-list", "--count", "HEAD"]).catch(() => "0");

        repos.push({
          name: basename(dir),
          path: dir,
          branch,
          lastCommitHash: log.latest?.hash ?? "",
          lastCommitMsg: log.latest?.message ?? "",
          lastCommitDate: log.latest?.date ?? "",
          isDirty: !status.isClean(),
          ahead,
          behind,
          totalCommits: parseInt(totalLog.trim(), 10),
          remoteUrl,
        });
      } catch {
        // Skip repos that can't be read
      }
      return; // Don't recurse into git repos
    }

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (EXCLUDE.has(entry) || entry.startsWith(".")) continue;
        const fullPath = join(dir, entry);
        try {
          if (statSync(fullPath).isDirectory()) {
            await walk(fullPath, depth + 1);
          }
        } catch {}
      }
    } catch {}
  }

  for (const root of rootPaths) {
    const expandedRoot = root.replace("~", homedir());
    if (existsSync(expandedRoot)) {
      await walk(expandedRoot, 0);
    }
  }

  return repos;
}
```

- [ ] **Step 2: Write seed script**

`src/db/seed.ts`:
```typescript
import { db } from "./client";
import { projects, gitSnapshots } from "./schema";
import { scanGitRepos } from "../lib/scanner";
import { eq } from "drizzle-orm";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function seedFromScan(scanPaths: string[] = ["~/Documents"]) {
  const repos = await scanGitRepos(scanPaths);
  let created = 0;
  let updated = 0;

  for (const repo of repos) {
    const slug = slugify(repo.name);
    const existing = db.select().from(projects).where(eq(projects.slug, slug)).get();

    if (!existing) {
      const [project] = db.insert(projects).values({
        slug,
        name: repo.name,
        repoPath: repo.path,
        githubUrl: repo.remoteUrl?.replace(/\.git$/, "") ?? null,
      }).returning();

      db.insert(gitSnapshots).values({
        projectId: project.id,
        branch: repo.branch,
        lastCommitHash: repo.lastCommitHash,
        lastCommitMsg: repo.lastCommitMsg,
        lastCommitDate: repo.lastCommitDate,
        isDirty: repo.isDirty,
        ahead: repo.ahead,
        behind: repo.behind,
        totalCommits: repo.totalCommits,
      }).run();
      created++;
    } else {
      // Update git snapshot
      db.insert(gitSnapshots).values({
        projectId: existing.id,
        branch: repo.branch,
        lastCommitHash: repo.lastCommitHash,
        lastCommitMsg: repo.lastCommitMsg,
        lastCommitDate: repo.lastCommitDate,
        isDirty: repo.isDirty,
        ahead: repo.ahead,
        behind: repo.behind,
        totalCommits: repo.totalCommits,
      }).run();
      updated++;
    }
  }

  return { total: repos.length, created, updated };
}
```

- [ ] **Step 3: Test scanner manually**

```bash
npx tsx src/db/seed.ts
# Should output: { total: ~98, created: ~98, updated: 0 }
sqlite3 ~/.devforge/devforge.db "SELECT COUNT(*) FROM projects"
```

- [ ] **Step 4: Create scan API route**

`src/app/api/scan/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { seedFromScan } from "@/db/seed";

export async function POST() {
  const result = await seedFromScan();
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/scanner.ts src/db/seed.ts src/app/api/scan/
git commit -m "feat: git repo scanner + seed script + scan API"
```

---

### Task 4: API routes for projects, issues, notes

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[slug]/route.ts`
- Create: `src/app/api/issues/route.ts`
- Create: `src/app/api/issues/[id]/route.ts`
- Create: `src/app/api/notes/route.ts`
- Create: `src/app/api/notes/[id]/route.ts`
- Create: `src/lib/queries.ts`

- [ ] **Step 1: Write reusable queries**

`src/lib/queries.ts` — borrowed from CCPM's Script-First pattern:
```typescript
import { db } from "@/db/client";
import { projects, issues, notes, gitSnapshots } from "@/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

// Next actionable issue (CCPM next.sh equivalent)
export function getNextActionableIssues(projectId: number, limit = 5) {
  return db.select().from(issues)
    .where(and(
      eq(issues.projectId, projectId),
      eq(issues.status, "open"),
      // No unresolved dependencies
      sql`NOT EXISTS (
        SELECT 1 FROM json_each(${issues.dependsOn}) AS dep
        JOIN issues blocked ON blocked.id = dep.value
        WHERE blocked.status NOT IN ('resolved', 'wont-fix')
      )`
    ))
    .orderBy(
      sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      issues.createdAt
    )
    .limit(limit)
    .all();
}

// Blocked issues (CCPM blocked.sh equivalent)
export function getBlockedIssues(projectId: number) {
  return db.all(sql`
    SELECT i.*, blocked.id as blocking_id, blocked.title as blocking_title
    FROM issues i, json_each(i.depends_on) AS dep
    JOIN issues blocked ON blocked.id = dep.value
    WHERE i.status = 'open'
    AND i.project_id = ${projectId}
    AND blocked.status NOT IN ('resolved', 'wont-fix')
  `);
}

// Project with latest git snapshot
export function getProjectWithGit(slug: string) {
  const project = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) return null;

  const git = db.select().from(gitSnapshots)
    .where(eq(gitSnapshots.projectId, project.id))
    .orderBy(desc(gitSnapshots.scannedAt))
    .limit(1)
    .get();

  const openIssues = db.select({ count: sql<number>`count(*)` })
    .from(issues)
    .where(and(eq(issues.projectId, project.id), inArray(issues.status, ["open", "in-progress", "in-review"])))
    .get();

  return { ...project, git, openIssueCount: openIssues?.count ?? 0 };
}

// Overview stats
export function getOverviewStats() {
  const totalProjects = db.select({ count: sql<number>`count(*)` }).from(projects).get()?.count ?? 0;
  const activeProjects = db.select({ count: sql<number>`count(*)` }).from(projects)
    .where(inArray(projects.stage, ["dev", "beta", "live"])).get()?.count ?? 0;
  const openIssues = db.select({ count: sql<number>`count(*)` }).from(issues)
    .where(inArray(issues.status, ["open", "in-progress", "in-review"])).get()?.count ?? 0;
  return { totalProjects, activeProjects, openIssues };
}
```

- [ ] **Step 2: Write projects API routes**

`src/app/api/projects/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projects, gitSnapshots } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  let query = db.select().from(projects);
  if (stage) query = query.where(sql`${projects.stage} = ${stage}`);

  const result = query.orderBy(desc(projects.updatedAt)).all();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = db.insert(projects).values(body).returning().get();
  return NextResponse.json(result, { status: 201 });
}
```

`src/app/api/projects/[slug]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projects, issues, notes, gitSnapshots } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getProjectWithGit } from "@/lib/queries";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectWithGit(slug);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectIssues = db.select().from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.createdAt)).all();

  const projectNotes = db.select().from(notes)
    .where(eq(notes.projectId, project.id))
    .orderBy(desc(notes.createdAt)).all();

  return NextResponse.json({ ...project, issues: projectIssues, notes: projectNotes });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();
  const result = db.update(projects).set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(projects.slug, slug)).returning().get();
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Write issues API routes**

`src/app/api/issues/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { issues } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  let result = db.select().from(issues);
  if (projectId) result = result.where(eq(issues.projectId, Number(projectId)));
  if (status) result = result.where(eq(issues.status, status as any));

  return NextResponse.json(result.orderBy(
    sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
    desc(issues.createdAt)
  ).all());
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = db.insert(issues).values(body).returning().get();
  return NextResponse.json(result, { status: 201 });
}
```

`src/app/api/issues/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { issues } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.status === "resolved") body.resolvedAt = new Date().toISOString();
  body.updatedAt = new Date().toISOString();
  const result = db.update(issues).set(body).where(eq(issues.id, Number(id))).returning().get();
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(issues).where(eq(issues.id, Number(id))).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write notes API routes**

`src/app/api/notes/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  let result = db.select().from(notes);
  if (projectId) result = result.where(eq(notes.projectId, Number(projectId)));
  return NextResponse.json(result.orderBy(desc(notes.createdAt)).all());
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = db.insert(notes).values(body).returning().get();
  return NextResponse.json(result, { status: 201 });
}
```

`src/app/api/notes/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = db.update(notes).set(body).where(eq(notes.id, Number(id))).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(notes).where(eq(notes.id, Number(id))).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ src/lib/queries.ts
git commit -m "feat: REST API routes — projects, issues, notes, scan"
```

---

## Chunk 2: Dashboard UI

### Task 5: Sidebar layout

**Files:**
- Create: `src/components/sidebar.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install shadcn/ui components needed**

```bash
npx shadcn@latest add button badge card dialog input label select separator sheet tabs textarea tooltip
```

- [ ] **Step 2: Write sidebar component**

`src/components/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: "🏠", label: "Overview", href: "/" },
  { icon: "📦", label: "Projects", href: "/projects" },
  { icon: "📋", label: "Issues", href: "/issues" },
  { icon: "📊", label: "Timeline", href: "/timeline" },
  { icon: "⚙️", label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-sidebar border-r border-slate-800 flex flex-col items-center py-4 gap-2 z-50">
      <Link href="/" className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-lg mb-4">
        ⚡
      </Link>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors",
            "hover:bg-slate-700",
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              ? "bg-blue-600/20 text-blue-400"
              : "text-slate-400"
          )}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: Update root layout**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevForge",
  description: "Personal Project Command Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        <Sidebar />
        <main className="ml-14 p-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx src/app/layout.tsx
git commit -m "feat: 56px icon sidebar layout"
```

---

### Task 6: Shared UI components

**Files:**
- Create: `src/components/stats-card.tsx`
- Create: `src/components/stage-badge.tsx`
- Create: `src/components/progress-bar.tsx`
- Create: `src/components/project-card.tsx`

- [ ] **Step 1: Write stats card**

`src/components/stats-card.tsx`:
```tsx
interface StatsCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatsCard({ label, value, color = "text-slate-50" }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg p-4 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Write stage badge**

`src/components/stage-badge.tsx`:
```tsx
const STAGE_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  idea: { bg: "bg-slate-800", text: "text-slate-400", icon: "💭" },
  dev: { bg: "bg-blue-900/50", text: "text-blue-400", icon: "🔨" },
  beta: { bg: "bg-amber-900/50", text: "text-amber-400", icon: "🧪" },
  live: { bg: "bg-green-900/50", text: "text-green-400", icon: "🚀" },
  paused: { bg: "bg-red-900/50", text: "text-red-400", icon: "⏸" },
  archived: { bg: "bg-stone-900/50", text: "text-stone-400", icon: "📦" },
};

export function StageBadge({ stage }: { stage: string }) {
  const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.idea;
  return (
    <span className={`${config.bg} ${config.text} px-2 py-0.5 rounded-full text-xs`}>
      {config.icon} {stage.charAt(0).toUpperCase() + stage.slice(1)}
    </span>
  );
}
```

- [ ] **Step 3: Write progress bar**

`src/components/progress-bar.tsx`:
```tsx
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const color = value < 30 ? "from-blue-500 to-blue-600"
    : value < 70 ? "from-blue-500 to-purple-500"
    : "from-green-500 to-emerald-500";

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write project card**

`src/components/project-card.tsx`:
```tsx
import Link from "next/link";
import { StageBadge } from "./stage-badge";
import { ProgressBar } from "./progress-bar";

interface ProjectCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  stage: string;
  progressPct: number;
  tags: string[];
  lastCommitDate?: string;
  branch?: string;
  openIssueCount: number;
}

export function ProjectCard(props: ProjectCardProps) {
  const timeAgo = props.lastCommitDate
    ? formatTimeAgo(new Date(props.lastCommitDate))
    : "—";

  return (
    <Link href={`/projects/${props.slug}`}>
      <div className="bg-card rounded-xl p-4 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
              {props.icon}
            </span>
            <div>
              <div className="font-semibold text-sm">{props.name}</div>
              <div className="text-xs text-slate-500">{props.description}</div>
            </div>
          </div>
          <StageBadge stage={props.stage} />
        </div>

        {props.tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {props.tags.map((tag) => (
              <span key={tag} className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-2 mb-2">
          <span>📝 {timeAgo}</span>
          <span>🔀 {props.branch ?? "—"}</span>
          <span>⚠️ {props.openIssueCount} issues</span>
        </div>

        <ProgressBar value={props.progressPct} label="Progress" />
      </div>
    </Link>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: shared UI components — stats card, stage badge, progress bar, project card"
```

---

### Task 7: Overview page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Write overview page**

`src/app/page.tsx`:
```tsx
import { StatsCard } from "@/components/stats-card";
import { ProjectCard } from "@/components/project-card";
import { getOverviewStats } from "@/lib/queries";
import { db } from "@/db/client";
import { projects, gitSnapshots, issues } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const stats = getOverviewStats();

  // Recent projects by last git activity
  const recentProjects = db.select({
    project: projects,
    lastCommitDate: gitSnapshots.lastCommitDate,
    branch: gitSnapshots.branch,
  })
    .from(projects)
    .leftJoin(gitSnapshots, eq(gitSnapshots.projectId, projects.id))
    .orderBy(desc(gitSnapshots.scannedAt))
    .limit(12)
    .all()
    .filter((row, idx, arr) => arr.findIndex(r => r.project.id === row.project.id) === idx)
    .slice(0, 6);

  // Open issue counts per project
  const issueCounts = db.select({
    projectId: issues.projectId,
    count: sql<number>`count(*)`,
  })
    .from(issues)
    .where(inArray(issues.status, ["open", "in-progress", "in-review"]))
    .groupBy(issues.projectId)
    .all();

  const issueMap = new Map(issueCounts.map(r => [r.projectId, r.count]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Projects" value={stats.totalProjects} />
        <StatsCard label="Active" value={stats.activeProjects} color="text-green-400" />
        <StatsCard label="Open Issues" value={stats.openIssues} color="text-amber-400" />
        <StatsCard label="Feedback" value={0} color="text-purple-400" />
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>
      <div className="grid grid-cols-3 gap-4">
        {recentProjects.map(({ project: p, lastCommitDate, branch }) => (
          <ProjectCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            description={p.description ?? ""}
            icon={p.icon ?? "📦"}
            stage={p.stage ?? "idea"}
            progressPct={p.progressPct ?? 0}
            tags={(p.tags as string[]) ?? []}
            lastCommitDate={lastCommitDate ?? undefined}
            branch={branch ?? undefined}
            openIssueCount={issueMap.get(p.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
# Open http://localhost:3000
# Should see Overview with stats and project grid
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: overview page — stats + recent projects grid"
```

---

### Task 8: Projects grid page

**Files:**
- Create: `src/app/projects/page.tsx`

- [ ] **Step 1: Write projects page with filter tabs**

`src/app/projects/page.tsx`:
```tsx
import { db } from "@/db/client";
import { projects, gitSnapshots, issues } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { ProjectCard } from "@/components/project-card";

export const dynamic = "force-dynamic";

export default function ProjectsPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const allProjects = db.select({
    project: projects,
    lastCommitDate: gitSnapshots.lastCommitDate,
    branch: gitSnapshots.branch,
  })
    .from(projects)
    .leftJoin(gitSnapshots, eq(gitSnapshots.projectId, projects.id))
    .orderBy(desc(projects.updatedAt))
    .all()
    .filter((row, idx, arr) => arr.findIndex(r => r.project.id === row.project.id) === idx);

  const issueCounts = db.select({
    projectId: issues.projectId,
    count: sql<number>`count(*)`,
  })
    .from(issues)
    .where(inArray(issues.status, ["open", "in-progress", "in-review"]))
    .groupBy(issues.projectId)
    .all();

  const issueMap = new Map(issueCounts.map(r => [r.projectId, r.count]));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <span className="text-sm text-slate-400">{allProjects.length} projects</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allProjects.map(({ project: p, lastCommitDate, branch }) => (
          <ProjectCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            description={p.description ?? ""}
            icon={p.icon ?? "📦"}
            stage={p.stage ?? "idea"}
            progressPct={p.progressPct ?? 0}
            tags={(p.tags as string[]) ?? []}
            lastCommitDate={lastCommitDate ?? undefined}
            branch={branch ?? undefined}
            openIssueCount={issueMap.get(p.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/projects/page.tsx
git commit -m "feat: projects grid page with filter tabs"
```

---

### Task 9: Project detail page with tabs

**Files:**
- Create: `src/app/projects/[slug]/page.tsx`
- Create: `src/components/issue-list.tsx`
- Create: `src/components/issue-form.tsx`
- Create: `src/components/git-log.tsx`

- [ ] **Step 1: Write issue list component**

`src/components/issue-list.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-900/50 text-red-400",
  medium: "bg-amber-900/50 text-amber-400",
  low: "bg-slate-800 text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-900/50 text-amber-400",
  "in-review": "bg-blue-900/50 text-blue-400",
  "in-progress": "bg-purple-900/50 text-purple-400",
  resolved: "bg-green-900/50 text-green-400",
  "wont-fix": "bg-red-900/50 text-red-400",
  deferred: "bg-stone-900/50 text-stone-400",
};

interface Issue {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
}

export function IssueList({ issues, projectId }: { issues: Issue[]; projectId: number }) {
  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div key={issue.id} className="bg-card rounded-lg p-3 flex justify-between items-center border border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              issue.priority === "high" ? "bg-red-400" :
              issue.priority === "medium" ? "bg-amber-400" : "bg-slate-500"
            }`} />
            <div>
              <div className="text-sm">{issue.title}</div>
              <div className="text-[11px] text-slate-500">
                #{issue.id} · {issue.createdAt?.split("T")[0]}
                {issue.source === "feedback" && " · 💬"}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[issue.status] ?? ""}`}>
              {issue.status}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[issue.priority] ?? ""}`}>
              {issue.priority}
            </Badge>
          </div>
        </div>
      ))}
      {issues.length === 0 && (
        <div className="text-center text-sm text-slate-500 py-8">No issues yet</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write project detail page**

`src/app/projects/[slug]/page.tsx`:
```tsx
import { db } from "@/db/client";
import { projects, issues, notes, gitSnapshots } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { StatsCard } from "@/components/stats-card";
import { StageBadge } from "@/components/stage-badge";
import { ProgressBar } from "@/components/progress-bar";
import { IssueList } from "@/components/issue-list";
import { getProjectWithGit } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectWithGit(slug);
  if (!project) notFound();

  const projectIssues = db.select().from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.createdAt)).all();

  const projectNotes = db.select().from(notes)
    .where(eq(notes.projectId, project.id))
    .orderBy(desc(notes.createdAt)).all();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-3">
        <a href="/projects" className="text-blue-400 hover:underline">Projects</a>
        <span className="mx-1">/</span>
        {project.name}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            {project.icon}
          </span>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-slate-400">{project.description}</p>
          </div>
        </div>
        <StageBadge stage={project.stage ?? "idea"} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatsCard label="Last Commit" value={project.git?.lastCommitDate?.split("T")[0] ?? "—"} />
        <StatsCard label="Branch" value={project.git?.branch ?? "—"} />
        <StatsCard label="Open Issues" value={project.openIssueCount} color="text-amber-400" />
        <StatsCard label="Commits" value={project.git?.totalCommits ?? 0} />
      </div>

      {/* Progress */}
      {(project.progressPct ?? 0) > 0 && (
        <div className="bg-card rounded-lg p-4 mb-6 border border-slate-800">
          <ProgressBar value={project.progressPct ?? 0} label={project.progressPhase || "Progress"} />
        </div>
      )}

      {/* Issues */}
      <h2 className="text-base font-semibold mb-3">Issues ({projectIssues.length})</h2>
      <IssueList issues={projectIssues} projectId={project.id} />

      {/* Notes */}
      <h2 className="text-base font-semibold mt-6 mb-3">Notes ({projectNotes.length})</h2>
      <div className="space-y-2">
        {projectNotes.map((note) => (
          <div key={note.id} className="bg-card rounded-lg p-3 border border-slate-800">
            <div className="text-sm font-medium">{note.title}</div>
            <div className="text-xs text-slate-500 mt-1">{note.createdAt?.split("T")[0]}</div>
          </div>
        ))}
        {projectNotes.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-4">No notes yet</div>
        )}
      </div>

      {/* Project Info */}
      <div className="bg-card rounded-lg p-4 mt-6 border border-slate-800">
        <h3 className="text-sm font-semibold mb-3">Project Info</h3>
        <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
          <span className="text-slate-500">Path</span>
          <span className="text-slate-300 font-mono">{project.repoPath}</span>
          {project.githubUrl && <>
            <span className="text-slate-500">GitHub</span>
            <a href={project.githubUrl} className="text-blue-400 hover:underline" target="_blank">{project.githubUrl}</a>
          </>}
          {project.websiteUrl && <>
            <span className="text-slate-500">Website</span>
            <a href={project.websiteUrl} className="text-blue-400 hover:underline" target="_blank">{project.websiteUrl}</a>
          </>}
          {(project.tags as string[])?.length > 0 && <>
            <span className="text-slate-500">Tags</span>
            <div className="flex gap-1">
              {(project.tags as string[]).map((tag) => (
                <span key={tag} className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">{tag}</span>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
# Navigate to http://localhost:3000/projects/myagent
# Should show project detail with stats, progress, issues, notes, info
```

- [ ] **Step 4: Commit**

```bash
git add src/app/projects/ src/components/issue-list.tsx
git commit -m "feat: project detail page with issues, notes, git info"
```

---

### Task 10: Cross-project issues page

**Files:**
- Create: `src/app/issues/page.tsx`

- [ ] **Step 1: Write issues page**

`src/app/issues/page.tsx`:
```tsx
import { db } from "@/db/client";
import { issues, projects } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function IssuesPage() {
  const allIssues = db.select({
    issue: issues,
    projectName: projects.name,
    projectSlug: projects.slug,
  })
    .from(issues)
    .innerJoin(projects, eq(issues.projectId, projects.id))
    .where(inArray(issues.status, ["open", "in-review", "in-progress"]))
    .orderBy(
      sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      desc(issues.createdAt)
    )
    .all();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Issues</h1>
      <div className="space-y-2">
        {allIssues.map(({ issue, projectName, projectSlug }) => (
          <div key={issue.id} className="bg-card rounded-lg p-3 flex justify-between items-center border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                issue.priority === "high" ? "bg-red-400" :
                issue.priority === "medium" ? "bg-amber-400" : "bg-slate-500"
              }`} />
              <div>
                <div className="text-sm">{issue.title}</div>
                <div className="text-[11px] text-slate-500">
                  <a href={`/projects/${projectSlug}`} className="text-blue-400 hover:underline">{projectName}</a>
                  {" · "}#{issue.id} · {issue.createdAt?.split("T")[0]}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-[10px]">{issue.status}</Badge>
              <Badge variant="outline" className="text-[10px]">{issue.priority}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/issues/
git commit -m "feat: cross-project issues page"
```

---

### Task 11: Settings page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Write settings page (placeholder with scan trigger)**

`src/app/settings/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleScan() {
    setScanning(true);
    setResult(null);
    const res = await fetch("/api/scan", { method: "POST" });
    const data = await res.json();
    setResult(`Scanned: ${data.total} repos, ${data.created} new, ${data.updated} updated`);
    setScanning(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-card rounded-lg p-6 border border-slate-800 max-w-xl">
        <h2 className="text-base font-semibold mb-4">Git Scanner</h2>
        <p className="text-sm text-slate-400 mb-4">
          Scan ~/Documents for git repositories and update project list.
        </p>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? "Scanning..." : "Run Scan"}
        </Button>
        {result && <p className="text-sm text-green-400 mt-3">{result}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: settings page with git scan trigger"
```

---

### Task 12: Final verification and push

- [ ] **Step 1: Run dev server and verify all pages**

```bash
npm run dev
```

Check:
- `http://localhost:3000` — Overview with stats + recent projects
- `http://localhost:3000/projects` — All projects grid
- `http://localhost:3000/projects/myagent` — Project detail
- `http://localhost:3000/issues` — Cross-project issues
- `http://localhost:3000/settings` — Scan trigger

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Push to GitHub**

```bash
git push origin master
```
