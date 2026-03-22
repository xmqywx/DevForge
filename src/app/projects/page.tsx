import { db } from "@/db/client";
import { projects, issues, gitSnapshots } from "@/db/schema";
import { ProjectCard } from "@/components/project-card";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  // All projects joined with latest git snapshot, ordered by updatedAt desc
  const rows = db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      description: projects.description,
      icon: projects.icon,
      stage: projects.stage,
      progressPct: projects.progressPct,
      tags: projects.tags,
      updatedAt: projects.updatedAt,
      branch: gitSnapshots.branch,
      lastCommitDate: gitSnapshots.lastCommitDate,
      scannedAt: gitSnapshots.scannedAt,
    })
    .from(projects)
    .leftJoin(gitSnapshots, eq(gitSnapshots.projectId, projects.id))
    .orderBy(desc(projects.updatedAt))
    .all();

  // Deduplicate by project id (keep first = most recent due to ordering)
  const seen = new Set<number>();
  const allProjects = rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  // Get open issue counts for all projects
  const projectIds = allProjects.map((p) => p.id);
  const issueCounts =
    projectIds.length > 0
      ? db
          .select({
            projectId: issues.projectId,
            count: sql<number>`count(*)`,
          })
          .from(issues)
          .where(
            inArray(issues.status, ["open", "in-progress", "in-review"])
          )
          .groupBy(issues.projectId)
          .all()
      : [];

  const issueCountMap = new Map(issueCounts.map((r) => [r.projectId, r.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Projects</h1>
        <span className="text-sm text-gray-500">{allProjects.length} projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProjects.map((p) => (
          <ProjectCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            description={p.description ?? ""}
            icon={p.icon ?? ""}
            stage={p.stage ?? "idea"}
            progressPct={p.progressPct ?? 0}
            tags={(p.tags as string[]) ?? []}
            lastCommitDate={p.lastCommitDate ?? undefined}
            branch={p.branch ?? undefined}
            openIssueCount={issueCountMap.get(p.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
