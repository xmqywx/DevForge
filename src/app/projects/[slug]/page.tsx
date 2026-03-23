import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { issues, notes, releases } from "@/db/schema";
import { getProjectWithGit } from "@/lib/queries";
import { eq, desc } from "drizzle-orm";
import { ProjectEditForm } from "@/components/project-edit-form";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectWithGit(slug);
  if (!project) notFound();

  const projectIssues = db
    .select({ id: issues.id, status: issues.status })
    .from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.createdAt))
    .all()
    .map((i) => ({ id: i.id, status: i.status ?? "open" }));

  const projectNotes = db
    .select({ id: notes.id })
    .from(notes)
    .where(eq(notes.projectId, project.id))
    .all();

  const projectReleases = db
    .select({ id: releases.id })
    .from(releases)
    .where(eq(releases.projectId, project.id))
    .all();

  return (
    <ProjectEditForm
      project={{
        ...project,
        issues: projectIssues,
        notes: projectNotes,
        releases: projectReleases,
      }}
    />
  );
}
