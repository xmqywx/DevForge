import { db } from "@/db/client";
import { feedbackReplies } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const replies = db
    .select()
    .from(feedbackReplies)
    .where(eq(feedbackReplies.feedbackId, id))
    .orderBy(asc(feedbackReplies.createdAt))
    .all();
  return Response.json(replies);
}
