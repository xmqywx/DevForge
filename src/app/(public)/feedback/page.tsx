import { db } from "@/db/client";
import { feedback, projects } from "@/db/schema";
import { ne, desc, eq } from "drizzle-orm";
import { VoteButton } from "@/components/vote-button";
import { LuMessageSquare } from "react-icons/lu";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_STYLES: Record<string, string> = {
  bug: "bg-red-100 text-red-700",
  feature: "bg-[#c6e135]/30 text-[#4d7c0f]",
  improvement: "bg-blue-100 text-blue-700",
  question: "bg-gray-100 text-gray-600",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-gray-100 text-gray-600",
  "under-review": "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-[#c6e135] text-[#1a1a1a]",
  "wont-fix": "bg-red-100 text-red-600",
};

export default function FeedbackListPage() {
  const allFeedback = db
    .select({
      id: feedback.id,
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      status: feedback.status,
      upvotes: feedback.upvotes,
      authorName: feedback.authorName,
      createdAt: feedback.createdAt,
      projectId: feedback.projectId,
    })
    .from(feedback)
    .where(ne(feedback.status, "spam"))
    .orderBy(desc(feedback.upvotes), desc(feedback.createdAt))
    .all();

  // Get project names for display
  const allProjects = db.select({ id: projects.id, name: projects.name }).from(projects).all();
  const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-gray-500 mt-1">Vote on ideas and report bugs.</p>
        </div>
        <Link href="/feedback/new" className="bg-[#c6e135] text-[#1a1a1a] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#b5d025] transition-colors text-sm">
          Submit Feedback
        </Link>
      </div>

      {allFeedback.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuMessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No feedback yet</h2>
          <p className="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allFeedback.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4">
              <div className="pt-1">
                <VoteButton feedbackId={item.id} initialVotes={item.upvotes ?? 0} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${TYPE_STYLES[item.type ?? "feature"]} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                    {item.type}
                  </span>
                  <span className={`${STATUS_STYLES[item.status ?? "open"]} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {projectMap.get(item.projectId) ?? "Unknown"}
                  </span>
                </div>
                <h3 className="font-semibold text-[#1a1a1a]">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{item.authorName ?? "Anonymous"}</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
