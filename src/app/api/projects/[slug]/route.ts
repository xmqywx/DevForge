import { db } from "@/db/client";
import { projects, issues, notes } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getProjectWithGit } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = getProjectWithGit(slug);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const projectIssues = db
    .select()
    .from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(
      sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      desc(issues.createdAt)
    )
    .all();

  const projectNotes = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, project.id))
    .orderBy(desc(notes.createdAt))
    .all();

  return Response.json({ ...project, issues: projectIssues, notes: projectNotes });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const existing = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!existing) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const row = db
    .update(projects)
    .set({ ...body, updatedAt: sql`datetime('now')` })
    .where(eq(projects.slug, slug))
    .returning()
    .get();

  return Response.json(row);
}
