import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/client";
import { issues, notes } from "@/db/schema";
import { getProjectWithGit } from "@/lib/queries";
import { StageBadge } from "@/components/stage-badge";
import { ProgressBar } from "@/components/progress-bar";
import { IssueList } from "@/components/issue-list";
import { eq, desc } from "drizzle-orm";
import { LuGitCommitHorizontal, LuTriangleAlert, LuTrendingUp, LuTrendingDown } from "react-icons/lu";

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

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-[#1a1a1a] transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[#1a1a1a] font-medium">{project.name}</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#1a1a1a]">
        Projects list / <span className="font-extrabold">{project.name}</span>
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-[#c6e135] rounded-2xl flex items-center justify-center text-2xl font-bold text-[#1a1a1a]">
                {project.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#1a1a1a]">{project.name}</h2>
                <StageBadge stage={project.stage ?? "idea"} />
              </div>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mb-6">{project.description}</p>
            )}

            {/* Big numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#c6e135]">
                  {project.git?.totalCommits ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                  <LuGitCommitHorizontal className="w-3 h-3" />
                  Commits
                  <LuTrendingUp className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#c6e135]">
                  {openIssues.length}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                  <LuTriangleAlert className="w-3 h-3" />
                  Open Issues
                  {openIssues.length > 3 ? (
                    <LuTrendingUp className="w-3 h-3 text-red-400" />
                  ) : (
                    <LuTrendingDown className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            {(project.progressPct ?? 0) > 0 && (
              <div className="mt-6">
                <ProgressBar
                  value={project.progressPct ?? 0}
                  label={project.progressPhase || "Progress"}
                />
              </div>
            )}
          </div>

          {/* Mint info card */}
          <div className="bg-[#d1ede0] rounded-2xl p-6 space-y-3 text-sm">
            <h3 className="font-semibold text-[#1a1a1a]">Project Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Project ID</span>
                <span className="font-mono text-xs text-[#1a1a1a]">{project.id}</span>
              </div>
              {project.githubUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-600">GitHub</span>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1a1a1a] hover:underline text-xs font-medium"
                  >
                    {project.githubUrl.replace("https://github.com/", "")}
                  </a>
                </div>
              )}
              {project.tags && (project.tags as string[]).length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Tech Stack</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(project.tags as string[]).map((tag) => (
                      <span
                        key={tag}
                        className="border border-gray-400/50 rounded-full px-2 py-0.5 text-[10px] text-[#1a1a1a]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.repoPath && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Path</span>
                  <span className="font-mono text-xs text-[#1a1a1a]">
                    {project.repoPath}
                  </span>
                </div>
              )}
              {project.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="text-[#1a1a1a]">{project.createdAt.split("T")[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Status chart placeholder */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Activity Status</h3>
            <div className="h-40 flex items-center justify-center">
              <svg width="100%" height="120" viewBox="0 0 400 120" fill="none" className="text-[#c6e135]">
                <path
                  d="M0 100 Q50 80 100 60 T200 40 T300 50 T400 20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M0 100 Q50 80 100 60 T200 40 T300 50 T400 20 V120 H0 Z"
                  fill="currentColor"
                  opacity="0.1"
                />
              </svg>
            </div>
          </div>

          {/* Recent Issues */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">
              Recent Issues ({openIssues.length})
            </h3>
            <IssueList
              issues={projectIssues.slice(0, 5).map((i) => ({
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
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">
              Notes ({projectNotes.length})
            </h3>
            {projectNotes.length > 0 ? (
              <div className="space-y-2">
                {projectNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#f0f0e8] rounded-xl p-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#1a1a1a]">{note.title}</span>
                      <span className="text-xs text-gray-400">
                        {note.createdAt?.split("T")[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-400 py-8">
                No notes yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
