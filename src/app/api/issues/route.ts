import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { issues } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const status = request.nextUrl.searchParams.get("status");

  const conditions = [];
  if (projectId) conditions.push(eq(issues.projectId, Number(projectId)));
  if (status)
    conditions.push(
      eq(issues.status, status as typeof issues.status.enumValues[number])
    );

  const query = db.select().from(issues);
  const rows =
    conditions.length > 0
      ? query
          .where(and(...conditions))
          .orderBy(
            sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
            issues.createdAt
          )
          .all()
      : query
          .orderBy(
            sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
            issues.createdAt
          )
          .all();

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(issues).values(body).returning().get();
  return Response.json(row, { status: 201 });
}
