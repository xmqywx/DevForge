# DevForge Plan 3: Public Feedback + Server Deployment

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing feedback system (submit feedback, vote, roadmap) and deploy to 106.54.19.137 with Nginx + PostgreSQL.

**Architecture:** Same Next.js app from Plan 1, with public routes added. Production uses PostgreSQL (Drizzle ORM handles the switch via env). Nginx reverse proxy, PM2 process manager. Images stored locally, served by Nginx.

**Tech Stack:** Next.js 15, Drizzle ORM (PostgreSQL adapter), Nodemailer, Nginx, PM2, PostgreSQL

**Spec:** `docs/specs/2026-03-23-devforge-design.md` — sections "Public Feedback", "Anti-Spam", "Image Upload", "Deployment"

**Depends on:** Plan 1 complete (DB schema, API routes, Dashboard), Plan 2 optional (MCP/Plugin work independently)

---

## File Structure (additions to Plan 1)

```
devforge/
├── src/
│   ├── db/
│   │   └── schema.ts             # Add: feedback, feedback_votes tables
│   ├── lib/
│   │   ├── email.ts              # Email notification
│   │   ├── anti-spam.ts          # Honeypot + rate limit
│   │   └── upload.ts             # Image upload handler
│   ├── app/
│   │   ├── api/
│   │   │   ├── feedback/
│   │   │   │   ├── route.ts          # GET (list), POST (submit)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # PATCH (status), DELETE
│   │   │   │       └── vote/
│   │   │   │           └── route.ts  # POST (upvote)
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # POST (image upload)
│   │   │   └── feedback/
│   │   │       └── convert/
│   │   │           └── route.ts      # POST (feedback → issue)
│   │   ├── (public)/                 # Public routes (no sidebar)
│   │   │   ├── layout.tsx            # Public layout (clean, no sidebar)
│   │   │   ├── page.tsx              # Project showcase
│   │   │   ├── p/[slug]/
│   │   │   │   └── page.tsx          # Public project page
│   │   │   ├── feedback/
│   │   │   │   ├── page.tsx          # Feedback list + vote
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Submit feedback form
│   │   │   └── roadmap/
│   │   │       └── page.tsx          # Public roadmap
│   │   └── (private)/                # Move existing pages here
│   │       └── layout.tsx            # Private layout (with sidebar)
│   └── components/
│       ├── feedback-form.tsx
│       ├── feedback-card.tsx
│       ├── vote-button.tsx
│       └── roadmap-board.tsx
├── public/
│   └── uploads/                      # Feedback images
├── deploy/
│   ├── nginx.conf                    # Nginx config
│   ├── ecosystem.config.js           # PM2 config
│   └── setup.sh                      # Server setup script
└── drizzle.config.ts                 # Add PostgreSQL option
```

---

## Chunk 1: Feedback Backend

### Task 1: Add feedback tables to schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add feedback and feedback_votes tables**

Append to `src/db/schema.ts`:
```typescript
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorName: text("author_name").default("匿名"),
  authorIp: text("author_ip"),
  title: text("title").notNull(),
  description: text("description").default(""),
  type: text("type", { enum: ["bug", "feature", "improvement", "question"] }).default("feature"),
  status: text("status", { enum: ["open", "under-review", "in-progress", "resolved", "wont-fix", "spam"] }).default("open"),
  upvotes: integer("upvotes").default(0),
  images: text("images", { mode: "json" }).$type<string[]>().default([]),
  isConverted: integer("is_converted", { mode: "boolean" }).default(false),
  issueId: integer("issue_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const feedbackVotes = sqliteTable("feedback_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feedbackId: integer("feedback_id").notNull().references(() => feedback.id, { onDelete: "cascade" }),
  voterIp: text("voter_ip").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
```

- [ ] **Step 2: Run migration**

```bash
npx drizzle-kit push
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add feedback + feedback_votes tables"
```

---

### Task 2: Anti-spam module

**Files:**
- Create: `src/lib/anti-spam.ts`

- [ ] **Step 1: Write honeypot + rate limiter**

`src/lib/anti-spam.ts`:
```typescript
// In-memory rate limiter (upgrade to Redis for multi-instance)
const ipRequests = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 3;         // max requests
const RATE_WINDOW = 60_000;   // per 1 minute

export function checkHoneypot(formData: { website?: string }): boolean {
  // If honeypot field is filled, it's a bot
  return !!formData.website;
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false; // not rate limited
  }

  record.count++;
  if (record.count > RATE_LIMIT) {
    return true; // rate limited
  }
  return false;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests) {
    if (now > record.resetAt) ipRequests.delete(ip);
  }
}, 300_000);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/anti-spam.ts
git commit -m "feat: anti-spam — honeypot + IP rate limiter"
```

---

### Task 3: Image upload

**Files:**
- Create: `src/lib/upload.ts`
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Write upload handler**

`src/lib/upload.ts`:
```typescript
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_FILES = 5;

export async function handleUpload(formData: FormData): Promise<string[]> {
  const files = formData.getAll("files") as File[];

  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed`);
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} exceeds 5MB limit`);
    }

    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }

  return urls;
}
```

- [ ] **Step 2: Write upload API route**

`src/app/api/upload/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { handleUpload } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const urls = await handleUpload(formData);
    return NextResponse.json({ urls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/upload.ts src/app/api/upload/ public/uploads/.gitkeep
git commit -m "feat: image upload — 5MB limit, PNG/JPG/GIF/WebP"
```

---

### Task 4: Feedback API routes

**Files:**
- Create: `src/app/api/feedback/route.ts`
- Create: `src/app/api/feedback/[id]/route.ts`
- Create: `src/app/api/feedback/[id]/vote/route.ts`
- Create: `src/app/api/feedback/convert/route.ts`

- [ ] **Step 1: Write feedback list + submit**

`src/app/api/feedback/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { feedback, projects } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { checkHoneypot, checkRateLimit } from "@/lib/anti-spam";
import { sendFeedbackNotification } from "@/lib/email";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectSlug = searchParams.get("project");

  let query = db.select().from(feedback).where(ne(feedback.status, "spam"));

  if (projectSlug) {
    const project = db.select().from(projects).where(eq(projects.slug, projectSlug)).get();
    if (project) query = query.where(eq(feedback.projectId, project.id));
  }

  return NextResponse.json(query.orderBy(desc(feedback.upvotes), desc(feedback.createdAt)).all());
}

export async function POST(req: Request) {
  const body = await req.json();
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";

  // Anti-spam checks
  if (checkHoneypot(body)) {
    return NextResponse.json({ success: true }); // Silent reject
  }
  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many submissions. Please wait." }, { status: 429 });
  }

  const project = db.select().from(projects).where(eq(projects.slug, body.project_slug)).get();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = db.insert(feedback).values({
    projectId: project.id,
    authorName: body.author_name || "匿名",
    authorIp: ip,
    title: body.title,
    description: body.description ?? "",
    type: body.type ?? "feature",
    images: body.images ?? [],
  }).returning().get();

  // Send email notification (async, don't block response)
  sendFeedbackNotification(result, project.name).catch(console.error);

  return NextResponse.json({ success: true, id: result.id }, { status: 201 });
}
```

- [ ] **Step 2: Write vote endpoint**

`src/app/api/feedback/[id]/vote/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { feedback, feedbackVotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";

  // Check if already voted
  const existing = db.select().from(feedbackVotes)
    .where(and(eq(feedbackVotes.feedbackId, Number(id)), eq(feedbackVotes.voterIp, ip)))
    .get();

  if (existing) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  db.insert(feedbackVotes).values({ feedbackId: Number(id), voterIp: ip }).run();
  db.update(feedback)
    .set({ upvotes: db.select().from(feedbackVotes).where(eq(feedbackVotes.feedbackId, Number(id))).all().length })
    .where(eq(feedback.id, Number(id))).run();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Write feedback → issue conversion**

`src/app/api/feedback/convert/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { feedback, issues } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { feedbackId } = await req.json();

  const fb = db.select().from(feedback).where(eq(feedback.id, feedbackId)).get();
  if (!fb) return NextResponse.json({ error: "Feedback not found" }, { status: 404 });

  // Create issue from feedback
  const issue = db.insert(issues).values({
    projectId: fb.projectId,
    title: fb.title,
    description: `**From feedback #${fb.id}** (by ${fb.authorName})\n\n${fb.description}`,
    type: fb.type === "bug" ? "bug" : "feature",
    priority: "medium",
    source: "feedback",
    feedbackId: fb.id,
  }).returning().get();

  // Mark feedback as converted
  db.update(feedback).set({
    isConverted: true,
    issueId: issue.id,
    status: "under-review",
    updatedAt: new Date().toISOString(),
  }).where(eq(feedback.id, feedbackId)).run();

  return NextResponse.json({ success: true, issueId: issue.id });
}
```

- [ ] **Step 4: Write feedback status update**

`src/app/api/feedback/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { feedback } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  body.updatedAt = new Date().toISOString();
  const result = db.update(feedback).set(body).where(eq(feedback.id, Number(id))).returning().get();
  return NextResponse.json(result);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(feedback).where(eq(feedback.id, Number(id))).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/feedback/ src/app/api/upload/
git commit -m "feat: feedback API — submit, vote, convert to issue, status management"
```

---

### Task 5: Email notification

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Write email module**

`src/lib/email.ts`:
```typescript
import { createTransport } from "nodemailer";

const transporter = process.env.SMTP_HOST
  ? createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendFeedbackNotification(
  fb: { id: number; title: string; type: string; description: string; authorName: string | null },
  projectName: string
) {
  if (!transporter || !process.env.NOTIFICATION_EMAIL) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "DevForge <noreply@devforge.dev>",
    to: process.env.NOTIFICATION_EMAIL,
    subject: `[DevForge] New ${fb.type}: ${fb.title} — ${projectName}`,
    html: `
      <h2>New Feedback on ${projectName}</h2>
      <p><strong>Type:</strong> ${fb.type}</p>
      <p><strong>From:</strong> ${fb.authorName ?? "匿名"}</p>
      <p><strong>Title:</strong> ${fb.title}</p>
      <hr>
      <p>${fb.description}</p>
      <hr>
      <p><a href="${process.env.DASHBOARD_URL ?? "http://localhost:3456"}/feedback">View in Dashboard</a></p>
    `,
  });
}
```

- [ ] **Step 2: Add env vars to .env.local**

```
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=DevForge <noreply@devforge.dev>
NOTIFICATION_EMAIL=
DASHBOARD_URL=http://localhost:3456
```

- [ ] **Step 3: Install nodemailer**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts .env.local
git commit -m "feat: email notification for new feedback"
```

---

## Chunk 2: Public Pages

### Task 6: Public layout (no sidebar)

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Move: existing pages to `src/app/(private)/`

- [ ] **Step 1: Create route groups**

Restructure:
- Move all existing pages (Overview, Projects, Issues, Timeline, Settings) into `(private)/` route group
- The `(private)/layout.tsx` includes the Sidebar
- The `(public)/layout.tsx` has a clean public header instead

`src/app/(public)/layout.tsx`:
```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold">DevForge</span>
        </div>
        <nav className="flex gap-4 text-sm text-slate-400">
          <a href="/" className="hover:text-slate-200">Projects</a>
          <a href="/feedback" className="hover:text-slate-200">Feedback</a>
          <a href="/roadmap" className="hover:text-slate-200">Roadmap</a>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/
git commit -m "feat: route groups — (private) with sidebar, (public) with clean header"
```

---

### Task 7: Public feedback submission page

**Files:**
- Create: `src/app/(public)/feedback/new/page.tsx`
- Create: `src/components/feedback-form.tsx`

- [ ] **Step 1: Write feedback form component**

`src/components/feedback-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Project { slug: string; name: string; }

export function FeedbackForm({ projects }: { projects: Project[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.urls) setImages(prev => [...prev, ...data.urls]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const body = {
      project_slug: formData.get("project"),
      type: formData.get("type"),
      title: formData.get("title"),
      description: formData.get("description"),
      author_name: formData.get("author_name") || undefined,
      website: formData.get("website"), // honeypot
      images,
    };

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Thanks for your feedback!</h2>
        <p className="text-slate-400">We'll review it and update the status.</p>
        <a href="/feedback" className="text-blue-400 hover:underline mt-4 inline-block">View all feedback</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Honeypot — hidden from humans */}
      <input name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

      <div>
        <Label>Project *</Label>
        <Select name="project" required>
          <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Type *</Label>
        <Select name="type" defaultValue="feature">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">🐛 Bug</SelectItem>
            <SelectItem value="feature">💡 Feature Request</SelectItem>
            <SelectItem value="improvement">📝 Improvement</SelectItem>
            <SelectItem value="question">❓ Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Title *</Label>
        <Input name="title" placeholder="Brief summary..." required />
      </div>

      <div>
        <Label>Description (Markdown supported)</Label>
        <Textarea name="description" placeholder="Describe in detail..." rows={6} />
      </div>

      <div>
        <Label>Your Name (optional)</Label>
        <Input name="author_name" placeholder="Anonymous if empty" />
      </div>

      <div>
        <Label>Screenshots (max 5, 5MB each)</Label>
        <Input type="file" multiple accept="image/*" onChange={handleImageUpload} />
        {images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {images.map((url, i) => (
              <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded border border-slate-700" />
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write page**

`src/app/(public)/feedback/new/page.tsx`:
```tsx
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FeedbackForm } from "@/components/feedback-form";

export default function NewFeedbackPage() {
  const publicProjects = db.select({ slug: projects.slug, name: projects.name })
    .from(projects).where(eq(projects.isPublic, true)).all();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Submit Feedback</h1>
      <p className="text-slate-400 mb-6">Report bugs, suggest features, or share ideas.</p>
      <FeedbackForm projects={publicProjects} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/feedback/new/ src/components/feedback-form.tsx
git commit -m "feat: public feedback submission page with honeypot + image upload"
```

---

### Task 8: Public feedback list + voting

**Files:**
- Create: `src/app/(public)/feedback/page.tsx`
- Create: `src/components/vote-button.tsx`
- Create: `src/components/feedback-card.tsx`

- [ ] **Step 1: Write vote button and feedback card (client components)**

- [ ] **Step 2: Write feedback list page (server component)**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/feedback/ src/components/vote-button.tsx src/components/feedback-card.tsx
git commit -m "feat: public feedback list with voting"
```

---

### Task 9: Public roadmap page

**Files:**
- Create: `src/app/(public)/roadmap/page.tsx`

- [ ] **Step 1: Write roadmap page**

Query all feedback/issues with status `in-progress` or `under-review`, grouped by project. Display as a Kanban-like board: Planned | In Progress | Completed.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(public\)/roadmap/
git commit -m "feat: public roadmap page"
```

---

### Task 10: Private feedback management

**Files:**
- Create: `src/app/(private)/feedback/page.tsx`

- [ ] **Step 1: Write feedback management page**

Admin view with:
- Full feedback list with status dropdown
- "Convert to Issue" button
- "Mark as Spam" button
- Filter by project/status/type

- [ ] **Step 2: Commit**

```bash
git add src/app/\(private\)/feedback/
git commit -m "feat: private feedback management — status, convert, spam"
```

---

## Chunk 3: Server Deployment

### Task 11: PostgreSQL adapter

**Files:**
- Modify: `drizzle.config.ts`
- Modify: `src/db/client.ts`

- [ ] **Step 1: Install PostgreSQL adapter**

```bash
npm install drizzle-orm/pg-core pg
npm install -D @types/pg
```

- [ ] **Step 2: Update client to support both SQLite and PostgreSQL**

`src/db/client.ts` — detect `DATABASE_URL` env var:
- If `DATABASE_URL` starts with `postgres://` → use pg adapter
- Otherwise → use better-sqlite3

- [ ] **Step 3: Commit**

```bash
git add src/db/client.ts drizzle.config.ts
git commit -m "feat: dual database support — SQLite (local) + PostgreSQL (production)"
```

---

### Task 12: Server deployment files

**Files:**
- Create: `deploy/nginx.conf`
- Create: `deploy/ecosystem.config.js`
- Create: `deploy/setup.sh`

- [ ] **Step 1: Write Nginx config**

`deploy/nginx.conf`:
```nginx
server {
    listen 80;
    server_name devforge.yourdomain.com;

    client_max_body_size 30M;

    location /uploads/ {
        alias /data/devforge/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://localhost:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 2: Write PM2 config**

`deploy/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: "devforge",
    script: "npm",
    args: "start",
    cwd: "/opt/devforge",
    env: {
      NODE_ENV: "production",
      PORT: 3456,
      DATABASE_URL: "postgres://devforge:password@localhost:5432/devforge",
      UPLOAD_DIR: "/data/devforge/uploads",
    },
  }],
};
```

- [ ] **Step 3: Write setup script**

`deploy/setup.sh`:
```bash
#!/bin/bash
# Run on 106.54.19.137
set -e

# Install dependencies
apt-get update
apt-get install -y postgresql nginx nodejs npm

# Create DB
sudo -u postgres createuser devforge
sudo -u postgres createdb devforge -O devforge

# Create upload directory
mkdir -p /data/devforge/uploads

# Clone and build
cd /opt
git clone https://github.com/xmqywx/DevForge.git devforge
cd devforge
npm install
npm run build

# PM2
npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup

# Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/devforge
ln -sf /etc/nginx/sites-available/devforge /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ DevForge deployed at http://$(hostname -I | awk '{print $1}'):3456"
```

- [ ] **Step 4: Commit and push**

```bash
git add deploy/
git commit -m "feat: deployment config — Nginx, PM2, setup script for 106.54.19.137"
git push origin master
```

---

### Task 13: Deploy to server

- [ ] **Step 1: SSH and run setup**

```bash
ssh root@106.54.19.137 "bash -s" < deploy/setup.sh
```

- [ ] **Step 2: Configure domain in Nginx**

Update `server_name` to actual domain.

- [ ] **Step 3: Configure SMTP for email notifications**

Set env vars in PM2 ecosystem config.

- [ ] **Step 4: Verify**

- Public pages accessible at domain
- Feedback submission works
- Image upload works
- Voting works
- Email notification received
