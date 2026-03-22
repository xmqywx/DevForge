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
  status: text("status", { enum: ["open", "in-progress", "resolved", "wont-fix", "deferred", "closed"] }).default("open"),
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

export const issueVotes = sqliteTable("issue_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueId: integer("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  voterIp: text("voter_ip").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const issueComments = sqliteTable("issue_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueId: integer("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  authorName: text("author_name").default("匿名"),
  authorIp: text("author_ip"),
  isOwner: integer("is_owner", { mode: "boolean" }).default(false),
  content: text("content").notNull(),
  images: text("images", { mode: "json" }).$type<string[]>().default([]),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const releases = sqliteTable("releases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  downloadUrl: text("download_url"),
  publishedAt: text("published_at").default(sql`(datetime('now'))`),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
