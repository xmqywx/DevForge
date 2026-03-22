import { db } from "@/db/client";
import { issues, projects } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { LuSearch, LuFilter, LuPlus } from "react-icons/lu";

export const dynamic = "force-dynamic";

const priorityDot: Record<string, string> = {
  high: "bg-[#ef4444]",
  medium: "bg-[#eab308]",
  low: "bg-[#9ca3af]",
};

const statusPill: Record<string, string> = {
  open: "border border-gray-300 text-[#1a1a1a]",
  "in-review": "bg-blue-100 text-blue-700",
  "in-progress": "bg-[#c6e135] text-[#1a1a1a]",
  resolved: "bg-emerald-100 text-emerald-700",
  "wont-fix": "bg-gray-200 text-gray-500",
  deferred: "border border-gray-300 text-gray-600",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function IssuesPage() {
  const rows = db
    .select({
      id: issues.id,
      title: issues.title,
      status: issues.status,
      priority: issues.priority,
      createdAt: issues.createdAt,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(issues)
    .innerJoin(projects, eq(issues.projectId, projects.id))
    .where(inArray(issues.status, ["open", "in-progress", "in-review"]))
    .orderBy(
      sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`,
      desc(issues.createdAt)
    )
    .all();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Issues</h1>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm flex-1 max-w-md">
          <LuSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues..."
            className="bg-transparent outline-none text-sm text-[#1a1a1a] placeholder:text-gray-400 w-full"
          />
        </div>
        <button className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <LuFilter className="w-4 h-4" />
          Filter
        </button>
        <input
          type="date"
          className="bg-white rounded-full px-4 py-2 shadow-sm text-sm text-gray-600 outline-none"
        />
        <input
          type="date"
          className="bg-white rounded-full px-4 py-2 shadow-sm text-sm text-gray-600 outline-none"
        />
        <button className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all">
          <LuPlus className="w-4 h-4" />
          Add Issue
        </button>
      </div>

      <div className="text-sm text-gray-500">{rows.length} open issues</div>

      {rows.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No open issues across projects</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${priorityDot[row.priority ?? "medium"]}`}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#1a1a1a] truncate">{row.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <a
                      href={`/projects/${row.projectSlug}`}
                      className="text-[#c6e135] font-medium hover:underline"
                    >
                      {row.projectName}
                    </a>
                    {" "}
                    <span className="text-gray-400">
                      #{row.id} &middot; {formatDate(row.createdAt)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-gray-400">#{row.id}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusPill[row.status ?? "open"] ?? statusPill.open}`}
                >
                  {(row.status ?? "open").replace("-", " ")}
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
