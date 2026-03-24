# Dashboard V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rebuild DevForge Private Dashboard (localhost:3102) as a full CRUD control center with cross-server interactions.

**Architecture:** Next.js 15 App Router, TailwindCSS 4, shadcn/ui, Tiptap, @dnd-kit for drag-drop. All feedback/image operations go through server API (https://forge.wdao.chat).

**Tech Stack:** Next.js 15, TailwindCSS 4, shadcn/ui, Tiptap, @dnd-kit/core, Drizzle ORM, SQLite

**Spec:** `docs/specs/2026-03-23-dashboard-v2-design.md`

**IMPORTANT CROSS-SERVER RULES:**
- Image upload → POST to `https://forge.wdao.chat/api/upload` (NOT local)
- Feedback reply → POST to `https://forge.wdao.chat/api/feedback/{id}/reply` with `x-owner-secret`
- Feedback status change → PATCH to `https://forge.wdao.chat/api/feedback/{id}`
- Issue comment → POST to `https://forge.wdao.chat/api/issues/{id}/comments` with `x-owner-secret`
- Image display → prefix `/uploads/` with `process.env.DEVFORGE_SERVER_URL`
- Read .env.local for `DEVFORGE_SERVER_URL` and `DEVFORGE_SYNC_SECRET`

---

## Phase 1: Layout + Navigation + Projects CRUD

### Task 1: New layout + navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/top-nav.tsx`

- [x] Update navigation tabs: Overview | Projects | Issues | Feedback | Releases | Milestones | Sync | Settings | Docs
- [x] Keep lime green light theme
- [x] Commit

### Task 2: Projects table page

**Files:**
- Rewrite: `src/app/projects/page.tsx`
- Create: `src/components/project-table.tsx`

- [x] Table view (not cards) with columns: Name | Stage | Progress | Issues | Public | Updated | Actions
- [x] Inline editing: stage dropdown, progress slider, is_public toggle
- [x] Search + stage filter
- [x] Batch select + batch actions (change stage, set public, archive)
- [x] "+ New Project" button
- [x] Commit

### Task 3: Project detail edit page

**Files:**
- Rewrite: `src/app/projects/[slug]/page.tsx`
- Create: `src/components/project-edit-form.tsx`

- [x] Form with all fields: name, slug, description (Tiptap), stage, priority, progress, tags (tag input), icon, GitHub URL, Website URL, is_public, README (Tiptap)
- [x] "Sync README from file" button (reads project's README.md)
- [x] "Preview on Portal" button → opens forge.wdao.chat/projects/{slug}
- [x] Sidebar: related Issues / Notes / Releases count
- [x] Save → PATCH /api/projects/{slug}
- [x] Commit

### Task 4: Issues kanban with drag-drop

**Files:**
- Install: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Rewrite: `src/app/issues/page.tsx`
- Create: `src/components/kanban-board.tsx`
- Create: `src/components/kanban-card.tsx`
- Create: `src/components/issue-create-dialog.tsx`

- [x] 4-column kanban: Open | In Progress | Done | Closed
- [x] Drag card between columns → auto PATCH status
- [x] Filter bar: project dropdown, priority pills, type pills, search
- [x] "+ New Issue" button → dialog with project select, title, description (Tiptap), type, priority, depends_on
- [x] Click card → right drawer with editable fields + comments
- [x] Comments: load from server API, reply as Owner (POST to server with x-owner-secret)
- [x] Image in comments: upload to server
- [x] Commit

---

## Phase 2: Feedback + Sync

### Task 5: Feedback management page

**Files:**
- Rewrite: `src/app/feedback/page.tsx` (or `src/app/feedback-admin/page.tsx`)
- Create: `src/components/feedback-admin-list.tsx`
- Create: `src/components/feedback-reply-drawer.tsx`
- Create: `src/lib/server-api.ts` (helper for server API calls)

- [x] Create `src/lib/server-api.ts`:
```typescript
const SERVER_URL = process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET = process.env.DEVFORGE_SYNC_SECRET ?? "";
const OWNER_SECRET = process.env.DEVFORGE_OWNER_SECRET ?? "";

export async function serverFetch(path: string, options?: RequestInit) { ... }
export async function serverUpload(file: File): Promise<string> { ... }
export async function ownerReply(feedbackId: number, content: string) { ... }
```

- [x] Add to `.env.local`:
```
NEXT_PUBLIC_DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_OWNER_SECRET=devforge-owner-2026
```

- [x] Feedback list: auto-pull from server on page load + 60s polling
- [x] Each card: avatar, author, title, description (SafeHtml), images (server URL prefix), type/status pills, votes
- [x] Actions per card: [Reply] [Convert to Issue] [Mark Spam] [Change Status dropdown]
- [x] Reply drawer: Tiptap editor, image upload to SERVER, send as Owner
- [x] Convert to Issue: copy to local issue, mark feedback as converted on server
- [x] All images display with server domain prefix
- [x] Commit

### Task 6: Sync control panel

**Files:**
- Rewrite: `src/app/settings/page.tsx` → move scan to sync page
- Create: `src/app/sync/page.tsx`
- Create: `src/components/sync-panel.tsx`

- [x] Status cards: Last Push time, Last Pull time, Server status (test connection), Auto-sync status
- [x] Buttons: [Push Now] [Pull Now] [Full Sync]
- [x] Sync log (last 20 operations) stored in localStorage
- [x] Stats comparison table: local vs server counts
- [x] Commit

---

## Phase 3: Releases + Milestones

### Task 7: Releases management

**Files:**
- Create: `src/app/releases/page.tsx`
- Create: `src/components/release-form.tsx`

- [x] Release list: sorted by date, grouped by project or flat timeline
- [x] Each: version pill, title, date, project name, [Edit] [Delete]
- [x] "+ New Release" → drawer/dialog: project select, version, title, changelog (Tiptap), download URL
- [x] "Generate from Git" button: reads recent commits and drafts changelog
- [x] Edit existing release
- [x] Commit

### Task 8: Milestones management

**Files:**
- Create: `src/app/milestones/page.tsx`
- Create: `src/components/milestone-editor.tsx`

- [x] Timeline view (editable)
- [x] Click milestone → edit form (title, description, date, status, icon)
- [x] "+ New Milestone" button
- [x] Delete milestone
- [x] Commit

---

## Phase 4: Settings + Docs

### Task 9: Settings page (9 tabs)

**Files:**
- Rewrite: `src/app/settings/page.tsx`
- Create: `src/app/settings/scan/page.tsx`
- Create: `src/app/settings/sync/page.tsx`
- Create: `src/app/settings/automation/page.tsx`
- Create: `src/app/settings/notifications/page.tsx`
- Create: `src/app/settings/mcp/page.tsx`
- Create: `src/app/settings/plugin/page.tsx`
- Create: `src/app/settings/database/page.tsx`
- Create: `src/app/settings/theme/page.tsx`
- Create: `src/app/settings/language/page.tsx`

- [x] Settings layout with tab navigation (9 tabs)
- [x] 9.1 Scan: path list, exclude dirs, frequency, [Scan Now]
- [x] 9.2 Sync: server URL, secrets (masked), auto-sync toggle, [Test Connection]
- [x] 9.3 Automation: global defaults + per-project overrides table
- [x] 9.4 Notifications: SMTP config, notification email, triggers, [Send Test]
- [x] 9.5 MCP: server path, registration status, tool list, [Re-register]
- [x] 9.6 Plugin: install path, version, command list, [Reload]
- [x] 9.7 Database: path, size, table row counts, [Export] [Import]
- [x] 9.8 Theme: light/dark/system toggle
- [x] 9.9 Language: EN/中文 toggle
- [x] Commit

### Task 10: Docs center

**Files:**
- Create: `src/app/docs/page.tsx`
- Create: `src/app/docs/[section]/page.tsx`
- Create: `src/content/docs/` (markdown files)

- [x] Sidebar navigation: Getting Started | Slash Commands | MCP Tools | CLI | Scripts | Sync | Deploy | Troubleshooting | FAQ
- [x] Each section renders markdown content
- [x] Copy code buttons on code blocks
- [x] Search within docs
- [x] Content from `docs/specs/2026-03-23-dashboard-v2-design.md` section 10
- [x] Commit

---

## Phase 5: i18n + Polish

### Task 11: i18n

- [x] Copy i18n system from Portal (context + JSON dictionaries + LanguageSwitcher)
- [x] Translate all Dashboard text to Chinese
- [x] Commit

### Task 12: Overview page redesign

**Files:**
- Rewrite: `src/app/page.tsx`

- [x] Stats cards: total projects, public, open issues, unread feedback, last sync
- [x] Recent activity timeline (issues + feedback + releases + commits)
- [x] Quick action buttons: [Scan] [Push] [Pull] [New Issue] [New Release]
- [x] Commit

### Task 13: Final verification + release

- [x] Verify all pages work
- [x] Build check
- [x] Create release v0.5.0
- [x] Push to GitHub
