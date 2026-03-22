"use client";
import { Badge } from "@/components/ui/badge";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-900/50 text-red-400",
  medium: "bg-amber-900/50 text-amber-400",
  low: "bg-slate-800 text-slate-400",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-900/50 text-amber-400",
  "in-review": "bg-blue-900/50 text-blue-400",
  "in-progress": "bg-purple-900/50 text-purple-400",
  resolved: "bg-green-900/50 text-green-400",
  "wont-fix": "bg-red-900/50 text-red-400",
  deferred: "bg-stone-900/50 text-stone-400",
};

interface Issue {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
}

export function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="bg-[#1e293b] rounded-lg p-3 flex justify-between items-center border border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${issue.priority === "high" ? "bg-red-400" : issue.priority === "medium" ? "bg-amber-400" : "bg-slate-500"}`}
            />
            <div>
              <div className="text-sm">{issue.title}</div>
              <div className="text-[11px] text-slate-500">
                #{issue.id} · {issue.createdAt?.split("T")[0]}
                {issue.source === "feedback" && " · 💬"}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] ${STATUS_COLORS[issue.status] ?? ""}`}
            >
              {issue.status}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] ${PRIORITY_COLORS[issue.priority] ?? ""}`}
            >
              {issue.priority}
            </Badge>
          </div>
        </div>
      ))}
      {issues.length === 0 && (
        <div className="text-center text-sm text-slate-500 py-8">
          No issues yet
        </div>
      )}
    </div>
  );
}
