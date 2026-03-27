import { db } from "@/db/client";
import { milestones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSyncService } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const milestone = db.select().from(milestones).where(eq(milestones.id, id)).get();
  if (!milestone) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(milestone);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(milestones)
    .where(eq(milestones.id, id))
    .get();
  if (!existing) {
    return Response.json({ error: "Milestone not found" }, { status: 404 });
  }

  const row = db
    .update(milestones)
    .set(body)
    .where(eq(milestones.id, id))
    .returning()
    .get();

  getSyncService().pushProjectById(existing.projectId);

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
    .where(eq(milestones.id, id))
    .get();
  if (!existing) {
    return Response.json({ error: "Milestone not found" }, { status: 404 });
  }

  db.delete(milestones).where(eq(milestones.id, id)).run();
  getSyncService().pushProjectById(existing.projectId);
  return Response.json({ deleted: true });
}
