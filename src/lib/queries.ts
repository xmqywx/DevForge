import { db } from "@/db/client";
import { projects, issues, notes, gitSnapshots } from "@/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

/** Next actionable issues — no unresolved blocking dependencies (CCPM-style) */
export function getNextActionableIssues(projectId: number, limit = 5) {
  return db
    .select()
    .from(issues)
    .where(
      and(
        eq(issues.projectId, projectId),
        eq(issues.status, "open"),
        sql`NOT EXISTS (
          SELECT 1 FROM json_each(${issues.dependsOn}) AS dep
          JOIN issues blocked ON blocked.id = dep.value
          WHERE blocked.status NOT IN ('resolved', 'wont-fix')
        )`
      )
    )
    .orderBy(
      sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      issues.createdAt
    )
    .limit(limit)
    .all();
}

/** Blocked issues with the issue(s) that block them */
export function getBlockedIssues(projectId: number) {
  return db.all(sql`
    SELECT i.*, blocked.id as blocking_id, blocked.title as blocking_title
    FROM issues i, json_each(i.depends_on) AS dep
    JOIN issues blocked ON blocked.id = dep.value
    WHERE i.status = 'open'
      AND i.project_id = ${projectId}
      AND blocked.status NOT IN ('resolved', 'wont-fix')
  `);
}

/** Project with latest git snapshot + open issue count */
export function getProjectWithGit(slug: string) {
  const project = db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .get();
  if (!project) return null;

  const git = db
    .select()
    .from(gitSnapshots)
    .where(eq(gitSnapshots.projectId, project.id))
    .orderBy(desc(gitSnapshots.scannedAt))
    .limit(1)
    .get();

  const openIssues = db
    .select({ count: sql<number>`count(*)` })
    .from(issues)
    .where(
      and(
        eq(issues.projectId, project.id),
        inArray(issues.status, ["open", "in-progress"] as const)
      )
    )
    .get();

  return { ...project, git: git ?? null, openIssueCount: openIssues?.count ?? 0 };
}

/** Overview stats for the dashboard */
export function getOverviewStats() {
  const totalProjects =
    db.select({ count: sql<number>`count(*)` }).from(projects).get()?.count ?? 0;

  const activeProjects =
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(inArray(projects.stage, ["dev", "beta", "live"]))
      .get()?.count ?? 0;

  const openIssues =
    db
      .select({ count: sql<number>`count(*)` })
      .from(issues)
      .where(inArray(issues.status, ["open", "in-progress"] as const))
      .get()?.count ?? 0;

  return { totalProjects, activeProjects, openIssues };
}
