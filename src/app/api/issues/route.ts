import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { issues, projects } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSyncService, notifyIssueChange } from "../../../../packages/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const status = request.nextUrl.searchParams.get("status");

  const conditions = [];
  if (projectId) conditions.push(eq(issues.projectId, projectId));
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
  if (row?.projectId) {
    getSyncService().pushProjectById(row.projectId);
    const project = db.select().from(projects).where(eq(projects.id, row.projectId)).get();
    notifyIssueChange(row.title, project?.slug ?? "", "创建", `优先级: ${row.priority}`);
  }
  return Response.json(row, { status: 201 });
}
