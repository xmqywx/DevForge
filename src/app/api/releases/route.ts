import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { releases } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  const query = db.select().from(releases);
  const rows = projectId
    ? query
        .where(eq(releases.projectId, Number(projectId)))
        .orderBy(desc(releases.publishedAt))
        .all()
    : query.orderBy(desc(releases.publishedAt)).all();

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(releases).values(body).returning().get();
  return Response.json(row, { status: 201 });
}
