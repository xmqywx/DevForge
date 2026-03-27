import { db } from "@/db/client";
import { issues } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSyncService } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(issue);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
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
    .where(eq(issues.id, id))
    .returning()
    .get();

  if (row?.projectId) {
    getSyncService().pushProjectById(row.projectId);
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
    .where(eq(issues.id, id))
    .get();
  if (!existing) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  db.delete(issues).where(eq(issues.id, id)).run();
  getSyncService().pushProjectById(existing.projectId);
  return Response.json({ deleted: true });
}
