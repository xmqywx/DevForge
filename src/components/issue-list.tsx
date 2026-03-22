"use client";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-[#ef4444]",
  medium: "bg-[#eab308]",
  low: "bg-[#9ca3af]",
};

const STATUS_PILL: Record<string, string> = {
  open: "border border-gray-300 text-[#1a1a1a]",
  "in-review": "bg-blue-100 text-blue-700",
  "in-progress": "bg-[#c6e135] text-[#1a1a1a]",
  resolved: "bg-emerald-100 text-emerald-700",
  "wont-fix": "bg-gray-200 text-gray-500",
  deferred: "border border-gray-300 text-gray-600",
};

interface Issue {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  projectName?: string;
}

export function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${PRIORITY_DOT[issue.priority] ?? PRIORITY_DOT.low}`}
            />
            <div className="min-w-0">
              <div className="font-semibold text-[#1a1a1a] truncate">{issue.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {issue.projectName && (
                  <span className="text-[#c6e135] font-medium">{issue.projectName} </span>
                )}
                #{issue.id}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-xs text-gray-400">
              #{issue.id}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_PILL[issue.status] ?? STATUS_PILL.open}`}
            >
              {issue.status.replace("-", " ")}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          </div>
        </div>
      ))}
      {issues.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-8">
          No issues yet
        </div>
      )}
    </div>
  );
}
