import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StageBadge } from "@/components/stage-badge";
import { ProgressBar } from "@/components/progress-bar";
import { LuFolderOpen } from "react-icons/lu";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PublicProjectsPage() {
  const publicProjects = db
    .select()
    .from(projects)
    .where(eq(projects.isPublic, true))
    .all();

  if (publicProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LuFolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No public projects yet</h2>
        <p className="text-gray-500">Projects marked as public will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <span className="text-sm text-gray-500">{publicProjects.length} public projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publicProjects.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                )}
              </div>
              <StageBadge stage={p.stage ?? "idea"} />
            </div>
            <ProgressBar value={p.progressPct ?? 0} />
            {p.tags && (p.tags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(p.tags as string[]).map((tag) => (
                  <span key={tag} className="bg-[#d1ede0] text-[#1a1a1a] text-xs px-2.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              {p.websiteUrl && (
                <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#65a30d] hover:underline">
                  Website
                </a>
              )}
              {p.githubUrl && (
                <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#65a30d] hover:underline">
                  GitHub
                </a>
              )}
              <Link href={`/feedback/new?project=${p.slug}`} className="text-sm text-[#65a30d] hover:underline">
                Give Feedback
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
