import { db } from "@/db/client";
import { feedback } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(feedback)
    .where(eq(feedback.id, id))
    .get();
  if (!existing) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }

  const row = db
    .update(feedback)
    .set({ ...body, updatedAt: sql`datetime('now')` })
    .where(eq(feedback.id, id))
    .returning()
    .get();

  return Response.json(row);
}

export async function DELETE(
  _request: Request,
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

  db.delete(feedback).where(eq(feedback.id, id)).run();
  return Response.json({ deleted: true });
}
