#!/usr/bin/env npx tsx
// Bidirectional sync: push local data to server, pull feedback back

// Load .env.local
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && !process.env[key]) process.env[key] = rest.join("=");
  }
}

import { db } from "../src/db/client";
import {
  projects,
  issues,
  notes,
  releases,
  milestones,
  gitSnapshots,
  feedback,
  feedbackReplies,
  feedbackVotes,
  issueVotes,
  issueComments,
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "http://106.54.19.137:3104";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

async function push() {
  console.log("Pushing to server...");

  // Only push public projects
  const publicProjects = db
    .select()
    .from(projects)
    .where(eq(projects.isPublic, true))
    .all();

  if (publicProjects.length === 0) {
    console.log("No public projects to push.");
    return;
  }

  const projectIds = publicProjects.map((p) => p.id);

  // Get related data for public projects only
  const allIssues = db
    .select()
    .from(issues)
    .all()
    .filter((i) => projectIds.includes(i.projectId));
  const allNotes = db
    .select()
    .from(notes)
    .all()
    .filter((n) => projectIds.includes(n.projectId));
  const allReleases = db
    .select()
    .from(releases)
    .all()
    .filter((r) => projectIds.includes(r.projectId));
  const allMilestones = db
    .select()
    .from(milestones)
    .all()
    .filter((m) => projectIds.includes(m.projectId));
  const allSnapshots = db
    .select()
    .from(gitSnapshots)
    .all()
    .filter((g) => projectIds.includes(g.projectId));

  const body = {
    projects: publicProjects,
    issues: allIssues,
    notes: allNotes,
    releases: allReleases,
    milestones: allMilestones,
    git_snapshots: allSnapshots,
  };

  console.log(
    `  ${publicProjects.length} projects, ${allIssues.length} issues, ${allNotes.length} notes, ${allReleases.length} releases, ${allMilestones.length} milestones, ${allSnapshots.length} snapshots`,
  );

  const res = await fetch(`${SERVER_URL}/api/sync/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Push failed (${res.status}): ${text}`);
  }

  const result = await res.json();
  console.log("Push result:", JSON.stringify(result.stats ?? result));
}

async function pull() {
  console.log("Pulling from server...");

  const res = await fetch(`${SERVER_URL}/api/sync/pull`, {
    headers: { "x-sync-secret": SYNC_SECRET },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pull failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  let feedbackCount = 0;
  let repliesCount = 0;
  let feedbackVotesCount = 0;
  let issueVotesCount = 0;
  let issueCommentsCount = 0;

  // Upsert feedback — match by title + projectId (IDs differ between local and server)
  if (data.feedback) {
    for (const fb of data.feedback) {
      const existing = db
        .select()
        .from(feedback)
        .where(and(
          eq(feedback.title, fb.title),
          eq(feedback.projectId, fb.projectId)
        ))
        .get();
      if (!existing) {
        try {
          // Don't use server's ID — let local auto-increment
          const { id, ...rest } = fb;
          db.insert(feedback).values(rest).run();
          feedbackCount++;
        } catch (e: any) {
          // Skip if foreign key constraint fails (project not local)
        }
      }
    }
  }

  // Upsert feedback replies
  if (data.feedback_replies) {
    for (const r of data.feedback_replies) {
      const existing = db
        .select()
        .from(feedbackReplies)
        .where(eq(feedbackReplies.id, r.id))
        .get();
      if (!existing) {
        try {
          db.insert(feedbackReplies).values(r).run();
          repliesCount++;
        } catch (e: any) {}
      }
    }
  }

  // Upsert feedback votes
  if (data.feedback_votes) {
    for (const v of data.feedback_votes) {
      const existing = db
        .select()
        .from(feedbackVotes)
        .where(eq(feedbackVotes.id, v.id))
        .get();
      if (!existing) {
        try {
          db.insert(feedbackVotes).values(v).run();
          feedbackVotesCount++;
        } catch (e: any) {}
      }
    }
  }

  // Upsert issue comments
  if (data.issue_comments) {
    for (const c of data.issue_comments) {
      const existing = db
        .select()
        .from(issueComments)
        .where(eq(issueComments.id, c.id))
        .get();
      if (!existing) {
        try {
          db.insert(issueComments).values(c).run();
          issueCommentsCount++;
        } catch (e: any) {}
      }
    }
  }

  // Upsert issue votes
  if (data.issue_votes) {
    for (const v of data.issue_votes) {
      const existing = db
        .select()
        .from(issueVotes)
        .where(eq(issueVotes.id, v.id))
        .get();
      if (!existing) {
        try {
          db.insert(issueVotes).values(v).run();
          issueVotesCount++;
        } catch (e: any) {}
      }
    }
  }

  // Upsert feedback-created issues (created on server when user submits feedback)
  let feedbackIssuesCount = 0;
  if (data.feedback_issues) {
    for (const i of data.feedback_issues) {
      const existing = db
        .select()
        .from(issues)
        .where(and(
          eq(issues.title, i.title),
          eq(issues.projectId, i.projectId),
          eq(issues.source, "feedback")
        ))
        .get();
      if (!existing) {
        try {
          const { id, ...rest } = i;
          db.insert(issues).values(rest).run();
          feedbackIssuesCount++;
        } catch (e: any) {}
      }
    }
  }

  console.log(
    `  Pulled: ${feedbackCount} new feedback, ${feedbackIssuesCount} feedback issues, ${repliesCount} replies, ${feedbackVotesCount} feedback votes, ${issueCommentsCount} comments, ${issueVotesCount} issue votes`,
  );
}

async function main() {
  const command = process.argv[2] ?? "both";

  if (command === "push" || command === "both") await push();
  if (command === "pull" || command === "both") await pull();

  console.log("Sync complete!");
}

main().catch((err) => {
  console.error("Sync error:", err.message);
  process.exit(1);
});
