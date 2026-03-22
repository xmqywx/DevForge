import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const stage = request.nextUrl.searchParams.get("stage");

  const query = db.select().from(projects);
  const rows = stage
    ? query
        .where(eq(projects.stage, stage as typeof projects.stage.enumValues[number]))
        .orderBy(desc(projects.updatedAt))
        .all()
    : query.orderBy(desc(projects.updatedAt)).all();

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(projects).values(body).returning().get();
  return Response.json(row, { status: 201 });
}
