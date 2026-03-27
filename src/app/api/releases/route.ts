import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { releases, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSyncService, notifyNewRelease } from "../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  const query = db.select().from(releases);
  const rows = projectId
    ? query
        .where(eq(releases.projectId, projectId))
        .orderBy(desc(releases.publishedAt))
        .all()
    : query.orderBy(desc(releases.publishedAt)).all();

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(releases).values(body).returning().get();
  if (row?.projectId) {
    getSyncService().pushProjectById(row.projectId);
    const project = db.select().from(projects).where(eq(projects.id, row.projectId)).get();
    notifyNewRelease(row.version, row.title, project?.slug ?? "");
  }
  return Response.json(row, { status: 201 });
}
