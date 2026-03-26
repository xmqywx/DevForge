#!/usr/bin/env tsx
/**
 * Migrate DevForge DB from integer IDs to UUID text IDs.
 *
 * Strategy:
 * 1. Backup the DB
 * 2. Read all data from all tables
 * 3. Generate UUID for each row, build oldId→newUUID mapping per table
 * 4. Drop old tables (FK-safe order)
 * 5. Create new tables with TEXT id schema
 * 6. Insert data with new UUIDs, updating all foreign key references
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { resolve } from "path";
import { copyFileSync, existsSync } from "fs";

const DB_PATH = resolve(process.env.HOME ?? "~", ".devforge/devforge.db");

if (!existsSync(DB_PATH)) {
  console.error("Database not found at", DB_PATH);
  process.exit(1);
}

// Backup before touching anything
const backupPath = DB_PATH + ".backup-" + Date.now();
copyFileSync(DB_PATH, backupPath);
console.log("Backed up to:", backupPath);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = OFF"); // Disable FK enforcement during migration

// Build an id→uuid map for a table that has an integer `id` column
function buildIdMap(tableName: string): { rows: any[]; idMap: Record<number, string> } {
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as any[];
  const idMap: Record<number, string> = {};
  for (const row of rows) {
    idMap[row.id] = randomUUID();
  }
  return { rows, idMap };
}

try {
  // ── 1. Read all tables ──────────────────────────────────────────────────────
  const projectsData      = buildIdMap("projects");
  const issuesData        = buildIdMap("issues");
  const notesData         = buildIdMap("notes");
  const gitSnapshotsData  = buildIdMap("git_snapshots");
  const feedbackData      = buildIdMap("feedback");
  const feedbackRepliesData = buildIdMap("feedback_replies");
  const feedbackVotesData = buildIdMap("feedback_votes");
  const issueVotesData    = buildIdMap("issue_votes");
  const issueCommentsData = buildIdMap("issue_comments");
  const releasesData      = buildIdMap("releases");
  const milestonesData    = buildIdMap("milestones");

  // settings has no integer id — read separately, no id map needed
  const settingsRows = db.prepare(`SELECT * FROM settings`).all() as any[];

  console.log("Read all tables. Row counts:");
  console.log(`  projects: ${projectsData.rows.length}`);
  console.log(`  issues: ${issuesData.rows.length}`);
  console.log(`  notes: ${notesData.rows.length}`);
  console.log(`  git_snapshots: ${gitSnapshotsData.rows.length}`);
  console.log(`  feedback: ${feedbackData.rows.length}`);
  console.log(`  feedback_replies: ${feedbackRepliesData.rows.length}`);
  console.log(`  feedback_votes: ${feedbackVotesData.rows.length}`);
  console.log(`  issue_votes: ${issueVotesData.rows.length}`);
  console.log(`  issue_comments: ${issueCommentsData.rows.length}`);
  console.log(`  releases: ${releasesData.rows.length}`);
  console.log(`  milestones: ${milestonesData.rows.length}`);
  console.log(`  settings: ${settingsRows.length}`);

  db.exec("BEGIN TRANSACTION");

  // ── 2. Drop old tables in FK-safe order (children before parents) ──────────
  const dropOrder = [
    "feedback_votes",
    "feedback_replies",
    "issue_votes",
    "issue_comments",
    "git_snapshots",
    "notes",
    "issues",
    "releases",
    "milestones",
    "feedback",
    "projects",
    "settings",
  ];
  for (const t of dropOrder) {
    db.exec(`DROP TABLE IF EXISTS ${t}`);
  }

  // ── 3. Create new tables with TEXT ids ─────────────────────────────────────
  db.exec(`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '📦',
      stage TEXT DEFAULT 'idea',
      progress_pct INTEGER DEFAULT 0,
      progress_phase TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      tags TEXT DEFAULT '[]',
      repo_path TEXT,
      github_url TEXT,
      website_url TEXT,
      is_public INTEGER DEFAULT 0,
      auto_record_issues TEXT DEFAULT 'default',
      auto_record_notes TEXT DEFAULT 'default',
      auto_session_summary TEXT DEFAULT 'default',
      auto_load_context TEXT DEFAULT 'default',
      auto_update_progress TEXT DEFAULT 'default',
      readme TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE issues (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'task',
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      source TEXT DEFAULT 'manual',
      feedback_id TEXT,
      depends_on TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      session_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE git_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      branch TEXT,
      last_commit_hash TEXT,
      last_commit_msg TEXT,
      last_commit_date TEXT,
      is_dirty INTEGER DEFAULT 0,
      ahead INTEGER DEFAULT 0,
      behind INTEGER DEFAULT 0,
      total_commits INTEGER DEFAULT 0,
      scanned_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE feedback (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_name TEXT DEFAULT '匿名',
      author_ip TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'feature',
      status TEXT DEFAULT 'open',
      upvotes INTEGER DEFAULT 0,
      images TEXT DEFAULT '[]',
      is_converted INTEGER DEFAULT 0,
      issue_id TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE feedback_replies (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      author_name TEXT DEFAULT '匿名',
      author_ip TEXT,
      is_owner INTEGER DEFAULT 0,
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE feedback_votes (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      voter_ip TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE issue_votes (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      voter_ip TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE issue_comments (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      author_name TEXT DEFAULT '匿名',
      author_ip TEXT,
      is_owner INTEGER DEFAULT 0,
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE releases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      download_url TEXT,
      published_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planned',
      date TEXT NOT NULL,
      icon TEXT DEFAULT 'milestone',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // ── 4. Insert data with remapped UUIDs ──────────────────────────────────────

  // projects — no FK dependencies
  const insertProject = db.prepare(
    `INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of projectsData.rows) {
    const uuid = projectsData.idMap[row.id];
    insertProject.run(
      uuid, row.slug, row.name, row.description, row.icon, row.stage,
      row.progress_pct, row.progress_phase, row.priority, row.tags,
      row.repo_path, row.github_url, row.website_url, row.is_public,
      row.auto_record_issues, row.auto_record_notes, row.auto_session_summary,
      row.auto_load_context, row.auto_update_progress, row.readme,
      row.created_at, row.updated_at
    );
  }
  console.log(`Inserted ${projectsData.rows.length} projects`);

  // feedback — FK: project_id
  // Must come before issues (issues.feedback_id references feedback.id)
  const insertFeedback = db.prepare(
    `INSERT INTO feedback VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of feedbackData.rows) {
    const uuid = feedbackData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    // issue_id in feedback is a forward-reference to issues — will be null on first pass;
    // we patch it after issues are inserted (see below)
    insertFeedback.run(
      uuid, projUuid, row.author_name, row.author_ip, row.title, row.description,
      row.type, row.status, row.upvotes, row.images, row.is_converted,
      null, // issue_id — patched below after issues are inserted
      row.avatar_url, row.created_at, row.updated_at
    );
  }
  console.log(`Inserted ${feedbackData.rows.length} feedback rows`);

  // issues — FK: project_id, feedback_id
  const insertIssue = db.prepare(
    `INSERT INTO issues VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of issuesData.rows) {
    const uuid = issuesData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    const fbUuid = row.feedback_id != null
      ? (feedbackData.idMap[row.feedback_id] ?? String(row.feedback_id))
      : null;

    // Remap depends_on: was number[], now string[] (UUIDs)
    let dependsOn = "[]";
    try {
      const deps: number[] = JSON.parse(row.depends_on || "[]");
      dependsOn = JSON.stringify(
        deps.map((d) => issuesData.idMap[d] ?? String(d))
      );
    } catch { /* keep empty array */ }

    insertIssue.run(
      uuid, projUuid, row.title, row.description, row.type, row.status,
      row.priority, row.source, fbUuid, dependsOn,
      row.created_at, row.updated_at, row.resolved_at
    );
  }
  console.log(`Inserted ${issuesData.rows.length} issues`);

  // Patch feedback.issue_id now that issues exist
  const patchFeedbackIssueId = db.prepare(
    `UPDATE feedback SET issue_id = ? WHERE id = ?`
  );
  for (const row of feedbackData.rows) {
    if (row.issue_id != null) {
      const fbUuid = feedbackData.idMap[row.id];
      const issueUuid = issuesData.idMap[row.issue_id] ?? String(row.issue_id);
      patchFeedbackIssueId.run(issueUuid, fbUuid);
    }
  }

  // notes — FK: project_id
  const insertNote = db.prepare(
    `INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of notesData.rows) {
    const uuid = notesData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    insertNote.run(
      uuid, projUuid, row.title, row.content, row.source, row.session_id, row.created_at
    );
  }
  console.log(`Inserted ${notesData.rows.length} notes`);

  // git_snapshots — FK: project_id
  const insertGitSnapshot = db.prepare(
    `INSERT INTO git_snapshots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of gitSnapshotsData.rows) {
    const uuid = gitSnapshotsData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    insertGitSnapshot.run(
      uuid, projUuid, row.branch, row.last_commit_hash, row.last_commit_msg,
      row.last_commit_date, row.is_dirty, row.ahead, row.behind,
      row.total_commits, row.scanned_at
    );
  }
  console.log(`Inserted ${gitSnapshotsData.rows.length} git_snapshots`);

  // releases — FK: project_id
  const insertRelease = db.prepare(
    `INSERT INTO releases VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of releasesData.rows) {
    const uuid = releasesData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    insertRelease.run(
      uuid, projUuid, row.version, row.title, row.content,
      row.download_url, row.published_at, row.created_at
    );
  }
  console.log(`Inserted ${releasesData.rows.length} releases`);

  // milestones — FK: project_id
  const insertMilestone = db.prepare(
    `INSERT INTO milestones VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of milestonesData.rows) {
    const uuid = milestonesData.idMap[row.id];
    const projUuid = projectsData.idMap[row.project_id] ?? row.project_id;
    insertMilestone.run(
      uuid, projUuid, row.title, row.description,
      row.status, row.date, row.icon, row.created_at
    );
  }
  console.log(`Inserted ${milestonesData.rows.length} milestones`);

  // feedback_replies — FK: feedback_id
  const insertFeedbackReply = db.prepare(
    `INSERT INTO feedback_replies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of feedbackRepliesData.rows) {
    const uuid = feedbackRepliesData.idMap[row.id];
    const fbUuid = feedbackData.idMap[row.feedback_id] ?? row.feedback_id;
    insertFeedbackReply.run(
      uuid, fbUuid, row.author_name, row.author_ip,
      row.is_owner, row.content, row.images, row.avatar_url, row.created_at
    );
  }
  console.log(`Inserted ${feedbackRepliesData.rows.length} feedback_replies`);

  // feedback_votes — FK: feedback_id
  const insertFeedbackVote = db.prepare(
    `INSERT INTO feedback_votes VALUES (?, ?, ?, ?)`
  );
  for (const row of feedbackVotesData.rows) {
    const uuid = feedbackVotesData.idMap[row.id];
    const fbUuid = feedbackData.idMap[row.feedback_id] ?? row.feedback_id;
    insertFeedbackVote.run(uuid, fbUuid, row.voter_ip, row.created_at);
  }
  console.log(`Inserted ${feedbackVotesData.rows.length} feedback_votes`);

  // issue_votes — FK: issue_id
  const insertIssueVote = db.prepare(
    `INSERT INTO issue_votes VALUES (?, ?, ?, ?)`
  );
  for (const row of issueVotesData.rows) {
    const uuid = issueVotesData.idMap[row.id];
    const issueUuid = issuesData.idMap[row.issue_id] ?? row.issue_id;
    insertIssueVote.run(uuid, issueUuid, row.voter_ip, row.created_at);
  }
  console.log(`Inserted ${issueVotesData.rows.length} issue_votes`);

  // issue_comments — FK: issue_id
  const insertIssueComment = db.prepare(
    `INSERT INTO issue_comments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of issueCommentsData.rows) {
    const uuid = issueCommentsData.idMap[row.id];
    const issueUuid = issuesData.idMap[row.issue_id] ?? row.issue_id;
    insertIssueComment.run(
      uuid, issueUuid, row.author_name, row.author_ip,
      row.is_owner, row.content, row.images, row.avatar_url, row.created_at
    );
  }
  console.log(`Inserted ${issueCommentsData.rows.length} issue_comments`);

  // settings — no id column, just copy key/value
  const insertSetting = db.prepare(`INSERT INTO settings VALUES (?, ?)`);
  for (const row of settingsRows) {
    insertSetting.run(row.key, row.value);
  }
  console.log(`Inserted ${settingsRows.length} settings`);

  db.exec("COMMIT");
  console.log("\nMigration complete!");
  console.log(`Backup retained at: ${backupPath}`);

} catch (err) {
  db.exec("ROLLBACK");
  console.error("\nMigration FAILED:", err);
  console.log("Restoring from backup...");
  db.close();
  copyFileSync(backupPath, DB_PATH);
  console.log("Restored from backup.");
  process.exit(1);
} finally {
  try { db.close(); } catch { /* already closed on error path */ }
}
