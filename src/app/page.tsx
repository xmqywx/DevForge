import { db } from "@/db/client";
import { projects, issues, gitSnapshots } from "@/db/schema";
import { getOverviewStats } from "@/lib/queries";
import { StatsCard } from "@/components/stats-card";
import { ProjectCard } from "@/components/project-card";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const stats = getOverviewStats();

  // Recent projects: join with latest git snapshot, order by scannedAt desc, dedup by project id
  const recentRows = db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      description: projects.description,
      icon: projects.icon,
      stage: projects.stage,
      progressPct: projects.progressPct,
      tags: projects.tags,
      branch: gitSnapshots.branch,
      lastCommitDate: gitSnapshots.lastCommitDate,
      scannedAt: gitSnapshots.scannedAt,
    })
    .from(gitSnapshots)
    .innerJoin(projects, eq(gitSnapshots.projectId, projects.id))
    .orderBy(desc(gitSnapshots.scannedAt))
    .all();

  // Deduplicate by project id, keeping the most recent snapshot
  const seen = new Set<number>();
  const recentProjects = recentRows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  }).slice(0, 6);

  // Get open issue counts for these projects
  const projectIds = recentProjects.map((p) => p.id);
  const issueCounts =
    projectIds.length > 0
      ? db
          .select({
            projectId: issues.projectId,
            count: sql<number>`count(*)`,
          })
          .from(issues)
          .where(
            and(
              inArray(issues.projectId, projectIds),
              inArray(issues.status, ["open", "in-progress", "in-review"])
            )
          )
          .groupBy(issues.projectId)
          .all()
      : [];

  const issueCountMap = new Map(issueCounts.map((r) => [r.projectId, r.count]));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Projects" value={stats.totalProjects} subtitle="+2 this month" />
        <StatsCard label="Active" value={stats.activeProjects} subtitle="+1 this month" />
        <StatsCard label="Open Issues" value={stats.openIssues} subtitle="+3 this month" />
        <StatsCard label="Feedback" value={0} subtitle="0 this month" />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4">Recent Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map((p) => (
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
    </div>
  );
}
