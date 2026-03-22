import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/client";
import { issues, notes } from "@/db/schema";
import { getProjectWithGit } from "@/lib/queries";
import { StatsCard } from "@/components/stats-card";
import { StageBadge } from "@/components/stage-badge";
import { ProgressBar } from "@/components/progress-bar";
import { IssueList } from "@/components/issue-list";
import { eq, desc } from "drizzle-orm";

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
    .select()
    .from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.createdAt))
    .all();

  const projectNotes = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, project.id))
    .orderBy(desc(notes.createdAt))
    .all();

  const openIssues = projectIssues.filter(
    (i) => i.status === "open" || i.status === "in-progress" || i.status === "in-review"
  );

  const lastCommit = project.git?.lastCommitDate
    ? new Date(project.git.lastCommitDate).toLocaleDateString()
    : "N/A";

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/projects" className="hover:text-slate-200 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-slate-200">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            {project.icon}
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <StageBadge stage={project.stage ?? "idea"} />
            </div>
            {project.description && (
              <p className="text-sm text-slate-400 mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-sm px-4 py-2 rounded-lg transition-colors">
          Edit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Last Commit" value={lastCommit} />
        <StatsCard label="Branch" value={project.git?.branch ?? "N/A"} />
        <StatsCard
          label="Open Issues"
          value={openIssues.length}
          color="text-amber-400"
        />
        <StatsCard
          label="Total Commits"
          value={project.git?.totalCommits ?? 0}
        />
      </div>

      {/* Progress */}
      {(project.progressPct ?? 0) > 0 && (
        <ProgressBar
          value={project.progressPct ?? 0}
          label={project.progressPhase || "Progress"}
        />
      )}

      {/* Issues */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Issues ({openIssues.length})
        </h2>
        <IssueList
          issues={projectIssues.map((i) => ({
            id: i.id,
            title: i.title,
            type: i.type ?? "task",
            status: i.status ?? "open",
            priority: i.priority ?? "medium",
            source: i.source ?? "manual",
            createdAt: i.createdAt ?? "",
          }))}
        />
      </div>

      {/* Notes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Notes ({projectNotes.length})
        </h2>
        {projectNotes.length > 0 ? (
          <div className="space-y-2">
            {projectNotes.map((note) => (
              <div
                key={note.id}
                className="bg-[#1e293b] rounded-lg p-3 border border-slate-800"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">{note.title}</span>
                  <span className="text-[11px] text-slate-500">
                    {note.createdAt?.split("T")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500 py-8">
            No notes yet
          </div>
        )}
      </div>

      {/* Project Info */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Project Info</h2>
        <div className="bg-[#1e293b] rounded-lg p-4 border border-slate-800 space-y-3 text-sm">
          {project.repoPath && (
            <div className="flex justify-between">
              <span className="text-slate-400">Path</span>
              <span className="text-slate-200 font-mono text-xs">
                {project.repoPath}
              </span>
            </div>
          )}
          {project.githubUrl && (
            <div className="flex justify-between">
              <span className="text-slate-400">GitHub</span>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {project.githubUrl}
              </a>
            </div>
          )}
          {project.websiteUrl && (
            <div className="flex justify-between">
              <span className="text-slate-400">Website</span>
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {project.websiteUrl}
              </a>
            </div>
          )}
          {project.tags && (project.tags as string[]).length > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Tags</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {(project.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full text-[10px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.createdAt && (
            <div className="flex justify-between">
              <span className="text-slate-400">Created</span>
              <span className="text-slate-200">
                {project.createdAt.split("T")[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
