import { db } from "@/db/client";
import { issues, projects } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
const priorityColor: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <span className="text-sm text-slate-400">{rows.length} open</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No open issues across projects</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
            >
              {/* Priority dot */}
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${priorityColor[row.priority ?? "medium"]}`}
              />

              {/* Title + project link */}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  <a
                    href={`/projects/${row.projectSlug}`}
                    className="text-blue-500 hover:underline"
                  >
                    {row.projectName}
                  </a>
                  {" "}
                  <span className="text-muted-foreground">
                    #{row.id} &middot; {formatDate(row.createdAt)}
                  </span>
                </p>
              </div>

              {/* Badges */}
              <Badge variant="outline" className="shrink-0 capitalize">
                {row.status}
              </Badge>
              <Badge variant="outline" className="shrink-0 capitalize">
                {row.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
