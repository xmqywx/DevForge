import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { projects, issues } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getSyncService } from "../../../../packages/sync";

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

  // Attach open issue counts
  const projectIds = rows.map((r) => r.id);
  const issueCounts =
    projectIds.length > 0
      ? db
          .select({
            projectId: issues.projectId,
            count: sql<number>`count(*)`,
          })
          .from(issues)
          .where(inArray(issues.status, ["open", "in-progress"]))
          .groupBy(issues.projectId)
          .all()
      : [];

  const issueCountMap = new Map(issueCounts.map((r) => [r.projectId, r.count]));

  const rowsWithCounts = rows.map((r) => ({
    ...r,
    openIssueCount: issueCountMap.get(r.id) ?? 0,
  }));

  return Response.json(rowsWithCounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(projects).values(body).returning().get();
  if (row?.isPublic) {
    getSyncService().debouncedPush();
  }
  return Response.json(row, { status: 201 });
}
