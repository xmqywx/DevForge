import { db } from "@/db/client";
import { releases } from "@/db/schema";
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
    .from(releases)
    .where(eq(releases.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Release not found" }, { status: 404 });
  }

  const row = db
    .update(releases)
    .set(body)
    .where(eq(releases.id, Number(id)))
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
    .from(releases)
    .where(eq(releases.id, Number(id)))
    .get();
  if (!existing) {
    return Response.json({ error: "Release not found" }, { status: 404 });
  }

  db.delete(releases).where(eq(releases.id, Number(id))).run();
  return Response.json({ deleted: true });
}
