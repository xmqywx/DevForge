import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { feedback, feedbackVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db
    .select()
    .from(feedback)
    .where(eq(feedback.id, id))
    .get();
  if (!existing) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  // Check for duplicate vote
  const alreadyVoted = db
    .select()
    .from(feedbackVotes)
    .where(and(eq(feedbackVotes.feedbackId, id), eq(feedbackVotes.voterIp, ip)))
    .get();

  if (alreadyVoted) {
    return Response.json({ error: "Already voted" }, { status: 409 });
  }

  // Record vote and increment counter
  db.insert(feedbackVotes).values({ feedbackId: id, voterIp: ip }).run();
  db.update(feedback)
    .set({ upvotes: sql`${feedback.upvotes} + 1` })
    .where(eq(feedback.id, id))
    .run();

  const updated = db.select().from(feedback).where(eq(feedback.id, id)).get();
  return Response.json(updated);
}
