import { db } from "@/db/client";
import { issues } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { syncProject } from "@/lib/auto-sync";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(issues)
    .where(eq(issues.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  // Auto-set resolvedAt when status changes to resolved
  const updates: Record<string, unknown> = {
    ...body,
    updatedAt: sql`datetime('now')`,
  };
  if (body.status === "resolved" && existing.status !== "resolved") {
    updates.resolvedAt = sql`datetime('now')`;
  }

  const row = db
    .update(issues)
    .set(updates)
    .where(eq(issues.id, Number(id)))
    .returning()
    .get();

  if (row?.projectId) {
    syncProject(row.projectId);
  }

  return Response.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db
    .select()
    .from(issues)
    .where(eq(issues.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  db.delete(issues).where(eq(issues.id, Number(id))).run();
  syncProject(existing.projectId);
  return Response.json({ deleted: true });
}
