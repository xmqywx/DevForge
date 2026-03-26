import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSyncService } from "../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  const query = db.select().from(notes);
  const rows = projectId
    ? query
        .where(eq(notes.projectId, projectId))
        .orderBy(desc(notes.createdAt))
        .all()
    : query.orderBy(desc(notes.createdAt)).all();

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(notes).values(body).returning().get();
  getSyncService().debouncedPush();
  return Response.json(row, { status: 201 });
}
