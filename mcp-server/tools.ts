import { z } from "zod";
import { db } from "../src/db/client.js";
import { projects, issues, notes, gitSnapshots, releases, milestones } from "../src/db/schema.js";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import { getNextActionableIssues, getBlockedIssues, getProjectWithGit, getOverviewStats } from "../src/lib/queries.js";
import { seedFromScan } from "../src/db/seed.js";

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  handler: (args: any) => any | Promise<any>;
};

export const TOOLS: ToolDef[] = [
  // 1. devforge_list_projects
  {
    name: "devforge_list_projects",
    description: "List all projects with stage, progress, and open issue count. Optional stage filter.",
    inputSchema: {
      stage: z.enum(["idea", "dev", "beta", "live", "paused", "archived"]).optional().describe("Filter by project stage"),
    },
    handler: (args: { stage?: string }) => {
      let query = db
        .select({
          slug: projects.slug,
          name: projects.name,
          stage: projects.stage,
          progressPct: projects.progressPct,
          progressPhase: projects.progressPhase,
          priority: projects.priority,
          description: projects.description,
        })
        .from(projects);

      const rows = args.stage
        ? query.where(eq(projects.stage, args.stage as any)).all()
        : query.all();

      // Attach open issue count per project
      return rows.map((p) => {
        const openCount = db
          .select({ count: sql<number>`count(*)` })
          .from(issues)
          .where(
            and(
              eq(issues.projectId,
                db.select({ id: projects.id }).from(projects).where(eq(projects.slug, p.slug)).get()!.id
              ),
              inArray(issues.status, ["open", "in-progress", "in-review"])
            )
          )
          .get();
        return { ...p, openIssueCount: openCount?.count ?? 0 };
      });
    },
  },

  // 2. devforge_get_project
  {
    name: "devforge_get_project",
    description: "Get full project details: info, git snapshot, open issues, recent notes, next actionable issues, and blocked issues.",
    inputSchema: {
      slug: z.string().describe("Project slug"),
    },
    handler: (args: { slug: string }) => {
      const project = getProjectWithGit(args.slug);
      if (!project) return { error: `Project '${args.slug}' not found` };

      const openIssuesList = db
        .select()
        .from(issues)
        .where(
          and(
            eq(issues.projectId, project.id),
            inArray(issues.status, ["open", "in-progress", "in-review"])
          )
        )
        .orderBy(
          sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
          desc(issues.createdAt)
        )
        .all();

      const recentNotes = db
        .select()
        .from(notes)
        .where(eq(notes.projectId, project.id))
        .orderBy(desc(notes.createdAt))
        .limit(5)
        .all();

      const nextActionable = getNextActionableIssues(project.id, 5);
      const blocked = getBlockedIssues(project.id);

      return {
        project,
        openIssues: openIssuesList,
        recentNotes,
        nextActionable,
        blocked,
      };
    },
  },

  // 3. devforge_add_issue
  {
    name: "devforge_add_issue",
    description: "Add an issue to a project.",
    inputSchema: {
      project_slug: z.string().describe("Project slug"),
      title: z.string().describe("Issue title"),
      description: z.string().optional().describe("Issue description"),
      type: z.enum(["bug", "feature", "improvement", "question", "task", "note"]).optional().describe("Issue type"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("Issue priority"),
      depends_on: z.array(z.number()).optional().describe("Array of issue IDs this depends on"),
    },
    handler: (args: {
      project_slug: string;
      title: string;
      description?: string;
      type?: string;
      priority?: string;
      depends_on?: number[];
    }) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.slug, args.project_slug))
        .get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db
        .insert(issues)
        .values({
          projectId: project.id,
          title: args.title,
          description: args.description ?? "",
          type: (args.type as any) ?? "task",
          priority: (args.priority as any) ?? "medium",
          dependsOn: args.depends_on ?? [],
        })
        .returning()
        .get();

      return { created: result };
    },
  },

  // 4. devforge_update_issue
  {
    name: "devforge_update_issue",
    description: "Update an issue's status, priority, or description. Auto-sets resolvedAt when status changes to resolved.",
    inputSchema: {
      id: z.number().describe("Issue ID"),
      status: z.enum(["open", "in-review", "in-progress", "resolved", "wont-fix", "deferred"]).optional().describe("New status"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("New priority"),
      description: z.string().optional().describe("New description"),
    },
    handler: (args: { id: number; status?: string; priority?: string; description?: string }) => {
      const existing = db.select().from(issues).where(eq(issues.id, args.id)).get();
      if (!existing) return { error: `Issue #${args.id} not found` };

      const updates: Record<string, any> = {
        updatedAt: sql`datetime('now')`,
      };
      if (args.status) updates.status = args.status;
      if (args.priority) updates.priority = args.priority;
      if (args.description !== undefined) updates.description = args.description;

      // Auto-set resolvedAt
      if (args.status === "resolved" || args.status === "wont-fix") {
        updates.resolvedAt = sql`datetime('now')`;
      }

      const result = db
        .update(issues)
        .set(updates)
        .where(eq(issues.id, args.id))
        .returning()
        .get();

      return { updated: result };
    },
  },

  // 5. devforge_add_note
  {
    name: "devforge_add_note",
    description: "Add a markdown note to a project.",
    inputSchema: {
      project_slug: z.string().describe("Project slug"),
      title: z.string().describe("Note title"),
      content: z.string().describe("Markdown content"),
      source: z.enum(["manual", "auto", "session-summary"]).optional().describe("Note source"),
    },
    handler: (args: { project_slug: string; title: string; content: string; source?: string }) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.slug, args.project_slug))
        .get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db
        .insert(notes)
        .values({
          projectId: project.id,
          title: args.title,
          content: args.content,
          source: (args.source as any) ?? "manual",
        })
        .returning()
        .get();

      return { created: result };
    },
  },

  // 6. devforge_update_progress
  {
    name: "devforge_update_progress",
    description: "Update a project's progress percentage, phase, or stage.",
    inputSchema: {
      project_slug: z.string().describe("Project slug"),
      progress_pct: z.number().min(0).max(100).optional().describe("Progress percentage (0-100)"),
      progress_phase: z.string().optional().describe("Current phase description"),
      stage: z.enum(["idea", "dev", "beta", "live", "paused", "archived"]).optional().describe("Project stage"),
    },
    handler: (args: {
      project_slug: string;
      progress_pct?: number;
      progress_phase?: string;
      stage?: string;
    }) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.slug, args.project_slug))
        .get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const updates: Record<string, any> = {
        updatedAt: sql`datetime('now')`,
      };
      if (args.progress_pct !== undefined) updates.progressPct = args.progress_pct;
      if (args.progress_phase !== undefined) updates.progressPhase = args.progress_phase;
      if (args.stage !== undefined) updates.stage = args.stage;

      const result = db
        .update(projects)
        .set(updates)
        .where(eq(projects.slug, args.project_slug))
        .returning()
        .get();

      return { updated: result };
    },
  },

  // 7. devforge_get_feedback
  {
    name: "devforge_get_feedback",
    description: "Get feedback entries for a project. (Placeholder — feedback system deploys in Plan 3.)",
    inputSchema: {
      project_slug: z.string().optional().describe("Project slug to filter by"),
    },
    handler: (_args: { project_slug?: string }) => {
      return {
        feedback: [],
        message: "Feedback system not yet deployed (Plan 3)",
      };
    },
  },

  // 8. devforge_add_release
  {
    name: "devforge_add_release",
    description: "Create a new release/changelog entry for a project. Use when a significant update is completed.",
    inputSchema: {
      project_slug: z.string().describe("Project slug"),
      version: z.string().describe("Version number, e.g. v1.0.0"),
      title: z.string().describe("Release title"),
      content: z.string().describe("Markdown changelog content"),
      download_url: z.string().optional().describe("Optional download link"),
    },
    handler: (args: {
      project_slug: string;
      version: string;
      title: string;
      content: string;
      download_url?: string;
    }) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.slug, args.project_slug))
        .get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db
        .insert(releases)
        .values({
          projectId: project.id,
          version: args.version,
          title: args.title,
          content: args.content,
          downloadUrl: args.download_url ?? null,
        })
        .returning()
        .get();

      return { success: true, release: result };
    },
  },

  // 9. devforge_scan
  {
    name: "devforge_scan",
    description: "Trigger a git repo scan to discover/update projects from local repositories.",
    inputSchema: {
      paths: z.array(z.string()).optional().describe("Directories to scan (defaults to ~/Documents)"),
    },
    handler: async (args: { paths?: string[] }) => {
      const result = await seedFromScan(args.paths);
      return {
        scanned: result.total,
        created: result.created,
        updated: result.updated,
      };
    },
  },

  // 10. devforge_add_milestone
  {
    name: "devforge_add_milestone",
    description: "Add a roadmap milestone to a project's evolution timeline.",
    inputSchema: {
      project_slug: z.string().describe("Project slug"),
      title: z.string().describe("Milestone title"),
      description: z.string().describe("Milestone description"),
      status: z.enum(["completed", "current", "planned"]).describe("Milestone status"),
      date: z.string().describe("Date like 2026-03 or 2026-Q2"),
      icon: z.enum(["milestone", "launch", "pivot", "idea", "integration"]).optional().describe("Icon type"),
    },
    handler: (args: {
      project_slug: string;
      title: string;
      description: string;
      status: string;
      date: string;
      icon?: string;
    }) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.slug, args.project_slug))
        .get();
      if (!project) return { error: `Project '${args.project_slug}' not found` };

      const result = db
        .insert(milestones)
        .values({
          projectId: project.id,
          title: args.title,
          description: args.description,
          status: args.status as any,
          date: args.date,
          icon: args.icon ?? "milestone",
        })
        .returning()
        .get();

      return { success: true, milestone: result };
    },
  },
];
