import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  feedback,
  feedbackReplies,
  feedbackVotes,
  issueVotes,
  issueComments,
  issues,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

export async function POST() {
  try {
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
    let feedbackIssuesCount = 0;

    // Upsert feedback — match by title + projectId
    if (data.feedback) {
      for (const fb of data.feedback) {
        const existing = db
          .select()
          .from(feedback)
          .where(and(eq(feedback.title, fb.title), eq(feedback.projectId, fb.projectId)))
          .get();
        if (!existing) {
          try {
            const { id, ...rest } = fb;
            db.insert(feedback).values(rest).run();
            feedbackCount++;
          } catch {
            // Skip if foreign key constraint fails
          }
        }
      }
    }

    // Upsert feedback replies
    if (data.feedback_replies) {
      for (const r of data.feedback_replies) {
        const existing = db.select().from(feedbackReplies).where(eq(feedbackReplies.id, r.id)).get();
        if (!existing) {
          try {
            db.insert(feedbackReplies).values(r).run();
            repliesCount++;
          } catch { /* skip */ }
        }
      }
    }

    // Upsert feedback votes
    if (data.feedback_votes) {
      for (const v of data.feedback_votes) {
        const existing = db.select().from(feedbackVotes).where(eq(feedbackVotes.id, v.id)).get();
        if (!existing) {
          try {
            db.insert(feedbackVotes).values(v).run();
            feedbackVotesCount++;
          } catch { /* skip */ }
        }
      }
    }

    // Upsert issue comments
    if (data.issue_comments) {
      for (const c of data.issue_comments) {
        const existing = db.select().from(issueComments).where(eq(issueComments.id, c.id)).get();
        if (!existing) {
          try {
            db.insert(issueComments).values(c).run();
            issueCommentsCount++;
          } catch { /* skip */ }
        }
      }
    }

    // Upsert issue votes
    if (data.issue_votes) {
      for (const v of data.issue_votes) {
        const existing = db.select().from(issueVotes).where(eq(issueVotes.id, v.id)).get();
        if (!existing) {
          try {
            db.insert(issueVotes).values(v).run();
            issueVotesCount++;
          } catch { /* skip */ }
        }
      }
    }

    // Upsert feedback-created issues
    if (data.feedback_issues) {
      for (const i of data.feedback_issues) {
        const existing = db
          .select()
          .from(issues)
          .where(
            and(
              eq(issues.title, i.title),
              eq(issues.projectId, i.projectId),
              eq(issues.source, "feedback")
            )
          )
          .get();
        if (!existing) {
          try {
            const { id, ...rest } = i;
            db.insert(issues).values(rest).run();
            feedbackIssuesCount++;
          } catch { /* skip */ }
        }
      }
    }

    const summary = `Pulled: ${feedbackCount} feedback, ${feedbackIssuesCount} issues, ${repliesCount} replies, ${feedbackVotesCount} fb votes, ${issueCommentsCount} comments, ${issueVotesCount} issue votes`;

    return NextResponse.json({
      success: true,
      summary,
      stats: {
        feedback: feedbackCount,
        feedbackIssues: feedbackIssuesCount,
        replies: repliesCount,
        feedbackVotes: feedbackVotesCount,
        issueComments: issueCommentsCount,
        issueVotes: issueVotesCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
