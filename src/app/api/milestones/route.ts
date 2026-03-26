import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { milestones, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { syncProject } from "@/lib/auto-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");

  const rows = projectId
    ? db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          title: milestones.title,
          description: milestones.description,
          status: milestones.status,
          date: milestones.date,
          icon: milestones.icon,
          createdAt: milestones.createdAt,
          projectName: projects.name,
        })
        .from(milestones)
        .leftJoin(projects, eq(milestones.projectId, projects.id))
        .where(eq(milestones.projectId, Number(projectId)))
        .orderBy(milestones.date)
        .all()
    : db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          title: milestones.title,
          description: milestones.description,
          status: milestones.status,
          date: milestones.date,
          icon: milestones.icon,
          createdAt: milestones.createdAt,
          projectName: projects.name,
        })
        .from(milestones)
        .leftJoin(projects, eq(milestones.projectId, projects.id))
        .orderBy(milestones.date)
        .all();

  autoPush(); return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const row = db.insert(milestones).values(body).returning().get();
  if (row?.projectId) {
    syncProject(row.projectId);
  }
  autoPush(); return Response.json(row, { status: 201 });
}
