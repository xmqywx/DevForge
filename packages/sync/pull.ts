import { db } from "../../src/db/client";
import { feedback, feedbackReplies, feedbackVotes, issueVotes, issueComments, issues } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { SyncConfig, PullResult } from "./types";
import { saveSyncStatus } from "./status";

/**
 * Pull server-master data to local.
 * Handles: feedback, feedback_replies, feedback_votes, issue_votes, issue_comments
 */
export async function pullFromServer(config: SyncConfig): Promise<PullResult> {
  const { url, syncSecret } = config.server;

  try {
    const res = await fetch(`${url}/api/sync/pull`, {
      headers: { "x-sync-secret": syncSecret },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown");
      saveSyncStatus("pull", "error", `Server returned ${res.status}`);
      return { success: false, error: errText };
    }

    const data = await res.json();
    const counts = { feedback: 0, replies: 0, votes: 0, comments: 0 };

    // Feedback (server-master: insert if not exists by UUID)
    for (const fb of data.feedback ?? []) {
      const existing = db.select().from(feedback).where(eq(feedback.id, fb.id)).get();
      if (!existing) {
        db.insert(feedback).values(fb).run();
        counts.feedback++;
      }
    }

    // Feedback replies
    for (const reply of data.feedbackReplies ?? data.feedback_replies ?? []) {
      const existing = db.select().from(feedbackReplies).where(eq(feedbackReplies.id, reply.id)).get();
      if (!existing) {
        db.insert(feedbackReplies).values(reply).run();
        counts.replies++;
      }
    }

    // Feedback votes
    for (const vote of data.feedbackVotes ?? data.feedback_votes ?? []) {
      const existing = db.select().from(feedbackVotes).where(eq(feedbackVotes.id, vote.id)).get();
      if (!existing) {
        db.insert(feedbackVotes).values(vote).run();
        counts.votes++;
      }
    }

    // Issue votes
    for (const vote of data.issueVotes ?? data.issue_votes ?? []) {
      const existing = db.select().from(issueVotes).where(eq(issueVotes.id, vote.id)).get();
      if (!existing) {
        db.insert(issueVotes).values(vote).run();
      }
    }

    // Issue comments (bidirectional: last-write-wins by updatedAt / createdAt)
    for (const comment of data.issueComments ?? data.issue_comments ?? []) {
      const existing = db.select().from(issueComments).where(eq(issueComments.id, comment.id)).get();
      if (!existing) {
        db.insert(issueComments).values(comment).run();
        counts.comments++;
      }
      // If exists and server version is newer, update
      // (comments don't have updatedAt, so just skip if exists — UUID means same comment)
    }

    // Feedback-created issues (server may create issues from feedback)
    for (const issue of data.feedbackIssues ?? data.feedback_issues ?? []) {
      const existing = db.select().from(issues).where(eq(issues.id, issue.id)).get();
      if (!existing) {
        db.insert(issues).values(issue).run();
      }
    }

    saveSyncStatus("pull", "ok", `Pulled ${counts.feedback} feedback, ${counts.comments} comments`);
    return { success: true, counts };

  } catch (err: any) {
    saveSyncStatus("pull", "error", err.message ?? "Pull failed");
    return { success: false, error: err.message };
  }
}
