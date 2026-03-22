import { db } from "@/db/client";
import { feedback, projects } from "@/db/schema";
import { ne, desc, eq, inArray } from "drizzle-orm";
import { LuThumbsUp, LuMap } from "react-icons/lu";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { title: "Planned", statuses: ["under-review"] as const, accent: "border-amber-300" },
  { title: "In Progress", statuses: ["in-progress"] as const, accent: "border-blue-400" },
  { title: "Completed", statuses: ["resolved"] as const, accent: "border-[#c6e135]" },
] as const;

export default function RoadmapPage() {
  // Get all non-spam feedback that has a roadmap-relevant status
  const allStatuses = COLUMNS.flatMap(c => c.statuses);
  const roadmapFeedback = db
    .select({
      id: feedback.id,
      title: feedback.title,
      type: feedback.type,
      status: feedback.status,
      upvotes: feedback.upvotes,
      projectId: feedback.projectId,
    })
    .from(feedback)
    .where(inArray(feedback.status, allStatuses as unknown as string[]))
    .orderBy(desc(feedback.upvotes), desc(feedback.createdAt))
    .all();

  // Get project names
  const allProjects = db.select({ id: projects.id, name: projects.name }).from(projects).all();
  const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

  const isEmpty = roadmapFeedback.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roadmap</h1>
        <p className="text-gray-500 mt-1">See what we are working on and what is planned.</p>
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuMap className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Roadmap is empty</h2>
          <p className="text-gray-500">Items will appear here once feedback is reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const items = roadmapFeedback.filter(f => (col.statuses as readonly string[]).includes(f.status ?? ""));
            return (
              <div key={col.title} className="space-y-3">
                <div className={`border-t-4 ${col.accent} pt-3`}>
                  <h2 className="font-semibold text-lg">
                    {col.title}
                    <span className="text-sm font-normal text-gray-400 ml-2">{items.length}</span>
                  </h2>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Nothing here yet.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {projectMap.get(item.projectId) ?? "Unknown"}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <LuThumbsUp className="w-3 h-3" />
                          {item.upvotes ?? 0}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
