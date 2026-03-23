# Dashboard V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

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

- [ ] Update navigation tabs: Overview | Projects | Issues | Feedback | Releases | Milestones | Sync | Settings | Docs
- [ ] Keep lime green light theme
- [ ] Commit

### Task 2: Projects table page

**Files:**
- Rewrite: `src/app/projects/page.tsx`
- Create: `src/components/project-table.tsx`

- [ ] Table view (not cards) with columns: Name | Stage | Progress | Issues | Public | Updated | Actions
- [ ] Inline editing: stage dropdown, progress slider, is_public toggle
- [ ] Search + stage filter
- [ ] Batch select + batch actions (change stage, set public, archive)
- [ ] "+ New Project" button
- [ ] Commit

### Task 3: Project detail edit page

**Files:**
- Rewrite: `src/app/projects/[slug]/page.tsx`
- Create: `src/components/project-edit-form.tsx`

- [ ] Form with all fields: name, slug, description (Tiptap), stage, priority, progress, tags (tag input), icon, GitHub URL, Website URL, is_public, README (Tiptap)
- [ ] "Sync README from file" button (reads project's README.md)
- [ ] "Preview on Portal" button → opens forge.wdao.chat/projects/{slug}
- [ ] Sidebar: related Issues / Notes / Releases count
- [ ] Save → PATCH /api/projects/{slug}
- [ ] Commit

### Task 4: Issues kanban with drag-drop

**Files:**
- Install: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Rewrite: `src/app/issues/page.tsx`
- Create: `src/components/kanban-board.tsx`
- Create: `src/components/kanban-card.tsx`
- Create: `src/components/issue-create-dialog.tsx`

- [ ] 4-column kanban: Open | In Progress | Done | Closed
- [ ] Drag card between columns → auto PATCH status
- [ ] Filter bar: project dropdown, priority pills, type pills, search
- [ ] "+ New Issue" button → dialog with project select, title, description (Tiptap), type, priority, depends_on
- [ ] Click card → right drawer with editable fields + comments
- [ ] Comments: load from server API, reply as Owner (POST to server with x-owner-secret)
- [ ] Image in comments: upload to server
- [ ] Commit

---

## Phase 2: Feedback + Sync

### Task 5: Feedback management page

**Files:**
- Rewrite: `src/app/feedback/page.tsx` (or `src/app/feedback-admin/page.tsx`)
- Create: `src/components/feedback-admin-list.tsx`
- Create: `src/components/feedback-reply-drawer.tsx`
- Create: `src/lib/server-api.ts` (helper for server API calls)

- [ ] Create `src/lib/server-api.ts`:
```typescript
const SERVER_URL = process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET = process.env.DEVFORGE_SYNC_SECRET ?? "";
const OWNER_SECRET = process.env.DEVFORGE_OWNER_SECRET ?? "";

export async function serverFetch(path: string, options?: RequestInit) { ... }
export async function serverUpload(file: File): Promise<string> { ... }
export async function ownerReply(feedbackId: number, content: string) { ... }
```

- [ ] Add to `.env.local`:
```
NEXT_PUBLIC_DEVFORGE_SERVER_URL=https://forge.wdao.chat
DEVFORGE_OWNER_SECRET=devforge-owner-2026
```

- [ ] Feedback list: auto-pull from server on page load + 60s polling
- [ ] Each card: avatar, author, title, description (SafeHtml), images (server URL prefix), type/status pills, votes
- [ ] Actions per card: [Reply] [Convert to Issue] [Mark Spam] [Change Status dropdown]
- [ ] Reply drawer: Tiptap editor, image upload to SERVER, send as Owner
- [ ] Convert to Issue: copy to local issue, mark feedback as converted on server
- [ ] All images display with server domain prefix
- [ ] Commit

### Task 6: Sync control panel

**Files:**
- Rewrite: `src/app/settings/page.tsx` → move scan to sync page
- Create: `src/app/sync/page.tsx`
- Create: `src/components/sync-panel.tsx`

- [ ] Status cards: Last Push time, Last Pull time, Server status (test connection), Auto-sync status
- [ ] Buttons: [Push Now] [Pull Now] [Full Sync]
- [ ] Sync log (last 20 operations) stored in localStorage
- [ ] Stats comparison table: local vs server counts
- [ ] Commit

---

## Phase 3: Releases + Milestones

### Task 7: Releases management

**Files:**
- Create: `src/app/releases/page.tsx`
- Create: `src/components/release-form.tsx`

- [ ] Release list: sorted by date, grouped by project or flat timeline
- [ ] Each: version pill, title, date, project name, [Edit] [Delete]
- [ ] "+ New Release" → drawer/dialog: project select, version, title, changelog (Tiptap), download URL
- [ ] "Generate from Git" button: reads recent commits and drafts changelog
- [ ] Edit existing release
- [ ] Commit

### Task 8: Milestones management

**Files:**
- Create: `src/app/milestones/page.tsx`
- Create: `src/components/milestone-editor.tsx`

- [ ] Timeline view (editable)
- [ ] Click milestone → edit form (title, description, date, status, icon)
- [ ] "+ New Milestone" button
- [ ] Delete milestone
- [ ] Commit

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

- [ ] Settings layout with tab navigation (9 tabs)
- [ ] 9.1 Scan: path list, exclude dirs, frequency, [Scan Now]
- [ ] 9.2 Sync: server URL, secrets (masked), auto-sync toggle, [Test Connection]
- [ ] 9.3 Automation: global defaults + per-project overrides table
- [ ] 9.4 Notifications: SMTP config, notification email, triggers, [Send Test]
- [ ] 9.5 MCP: server path, registration status, tool list, [Re-register]
- [ ] 9.6 Plugin: install path, version, command list, [Reload]
- [ ] 9.7 Database: path, size, table row counts, [Export] [Import]
- [ ] 9.8 Theme: light/dark/system toggle
- [ ] 9.9 Language: EN/中文 toggle
- [ ] Commit

### Task 10: Docs center

**Files:**
- Create: `src/app/docs/page.tsx`
- Create: `src/app/docs/[section]/page.tsx`
- Create: `src/content/docs/` (markdown files)

- [ ] Sidebar navigation: Getting Started | Slash Commands | MCP Tools | CLI | Scripts | Sync | Deploy | Troubleshooting | FAQ
- [ ] Each section renders markdown content
- [ ] Copy code buttons on code blocks
- [ ] Search within docs
- [ ] Content from `docs/specs/2026-03-23-dashboard-v2-design.md` section 10
- [ ] Commit

---

## Phase 5: i18n + Polish

### Task 11: i18n

- [ ] Copy i18n system from Portal (context + JSON dictionaries + LanguageSwitcher)
- [ ] Translate all Dashboard text to Chinese
- [ ] Commit

### Task 12: Overview page redesign

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] Stats cards: total projects, public, open issues, unread feedback, last sync
- [ ] Recent activity timeline (issues + feedback + releases + commits)
- [ ] Quick action buttons: [Scan] [Push] [Pull] [New Issue] [New Release]
- [ ] Commit

### Task 13: Final verification + release

- [ ] Verify all pages work
- [ ] Build check
- [ ] Create release v0.5.0
- [ ] Push to GitHub
