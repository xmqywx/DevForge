import { db } from "@/db/client";
import { milestones } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(milestones)
    .where(eq(milestones.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Milestone not found" }, { status: 404 });
  }

  const row = db
    .update(milestones)
    .set(body)
    .where(eq(milestones.id, Number(id)))
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
    .from(milestones)
    .where(eq(milestones.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Milestone not found" }, { status: 404 });
  }

  db.delete(milestones).where(eq(milestones.id, Number(id))).run();
  return Response.json({ deleted: true });
}
