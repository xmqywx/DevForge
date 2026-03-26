import { db } from "@/db/client";
import { feedback, issues } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSyncService } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { feedbackId } = body;

  if (!feedbackId) {
    return Response.json({ error: "feedbackId is required" }, { status: 400 });
  }

  const fb = db
    .select()
    .from(feedback)
    .where(eq(feedback.id, feedbackId))
    .get();
  if (!fb) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }
  if (fb.isConverted) {
    return Response.json({ error: "Feedback already converted" }, { status: 409 });
  }

  // Create issue from feedback
  const issue = db
    .insert(issues)
    .values({
      projectId: fb.projectId,
      title: fb.title,
      description: fb.description ?? "",
      type: fb.type as typeof issues.type.enumValues[number],
      source: "feedback",
      feedbackId: fb.id,
    })
    .returning()
    .get();

  // Mark feedback as converted
  db.update(feedback)
    .set({
      isConverted: true,
      issueId: issue.id,
      updatedAt: sql`datetime('now')`,
    })
    .where(eq(feedback.id, fb.id))
    .run();

  const updatedFb = db.select().from(feedback).where(eq(feedback.id, fb.id)).get();

  getSyncService().debouncedPush();
  return Response.json({ issue, feedback: updatedFb }, { status: 201 });
}
