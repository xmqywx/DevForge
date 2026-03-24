import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { projects, issues, feedback, releases, notes, milestones, gitSnapshots } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export interface CalendarEvent {
  id: string;
  type: "issue" | "issue-resolved" | "feedback" | "release" | "note" | "milestone" | "commit";
  title: string;
  date: string;
  projectName: string;
  projectSlug: string;
  metadata?: Record<string, string>;
}

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const monthParam = request.nextUrl.searchParams.get("month");

  const now = new Date();
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const events: CalendarEvent[] = [];

  // Issues — new (createdAt) and resolved (resolvedAt)
  const issueRows = db
    .select({
      id: issues.id,
      title: issues.title,
      createdAt: issues.createdAt,
      resolvedAt: issues.resolvedAt,
      priority: issues.priority,
      status: issues.status,
      type: issues.type,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(issues)
    .leftJoin(projects, eq(issues.projectId, projects.id))
    .where(
      sql`(
        (${issues.createdAt} >= ${startDate} AND ${issues.createdAt} <= ${endDate} || ' 23:59:59')
        OR
        (${issues.resolvedAt} IS NOT NULL AND ${issues.resolvedAt} >= ${startDate} AND ${issues.resolvedAt} <= ${endDate} || ' 23:59:59')
      )`
    )
    .all();

  for (const row of issueRows) {
    const createdDate = row.createdAt ? row.createdAt.split("T")[0].split(" ")[0] : null;
    const resolvedDate = row.resolvedAt ? row.resolvedAt.split("T")[0].split(" ")[0] : null;

    if (createdDate && createdDate >= startDate && createdDate <= endDate) {
      events.push({
        id: `issue-${row.id}`,
        type: "issue",
        title: row.title,
        date: createdDate,
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          priority: row.priority ?? "medium",
          status: row.status ?? "open",
          issueType: row.type ?? "task",
        },
      });
    }

    if (resolvedDate && resolvedDate >= startDate && resolvedDate <= endDate) {
      events.push({
        id: `issue-resolved-${row.id}`,
        type: "issue-resolved",
        title: row.title,
        date: resolvedDate,
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          priority: row.priority ?? "medium",
          status: row.status ?? "resolved",
          issueType: row.type ?? "task",
        },
      });
    }
  }

  // Feedback — createdAt
  const feedbackRows = db
    .select({
      id: feedback.id,
      title: feedback.title,
      createdAt: feedback.createdAt,
      type: feedback.type,
      status: feedback.status,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(feedback)
    .leftJoin(projects, eq(feedback.projectId, projects.id))
    .where(sql`${feedback.createdAt} >= ${startDate} AND ${feedback.createdAt} <= ${endDate} || ' 23:59:59'`)
    .all();

  for (const row of feedbackRows) {
    const date = row.createdAt ? row.createdAt.split("T")[0].split(" ")[0] : null;
    if (date) {
      events.push({
        id: `feedback-${row.id}`,
        type: "feedback",
        title: row.title,
        date,
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          feedbackType: row.type ?? "feature",
          status: row.status ?? "open",
        },
      });
    }
  }

  // Releases — publishedAt
  const releaseRows = db
    .select({
      id: releases.id,
      title: releases.title,
      version: releases.version,
      publishedAt: releases.publishedAt,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(releases)
    .leftJoin(projects, eq(releases.projectId, projects.id))
    .where(sql`${releases.publishedAt} >= ${startDate} AND ${releases.publishedAt} <= ${endDate} || ' 23:59:59'`)
    .all();

  for (const row of releaseRows) {
    const date = row.publishedAt ? row.publishedAt.split("T")[0].split(" ")[0] : null;
    if (date) {
      events.push({
        id: `release-${row.id}`,
        type: "release",
        title: row.title,
        date,
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          version: row.version,
        },
      });
    }
  }

  // Notes — createdAt (session-summary only)
  const noteRows = db
    .select({
      id: notes.id,
      title: notes.title,
      createdAt: notes.createdAt,
      source: notes.source,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(notes)
    .leftJoin(projects, eq(notes.projectId, projects.id))
    .where(
      sql`${notes.source} = 'session-summary' AND ${notes.createdAt} >= ${startDate} AND ${notes.createdAt} <= ${endDate} || ' 23:59:59'`
    )
    .all();

  for (const row of noteRows) {
    const date = row.createdAt ? row.createdAt.split("T")[0].split(" ")[0] : null;
    if (date) {
      events.push({
        id: `note-${row.id}`,
        type: "note",
        title: row.title,
        date,
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          source: row.source ?? "session-summary",
        },
      });
    }
  }

  // Milestones — date field
  const milestoneRows = db
    .select({
      id: milestones.id,
      title: milestones.title,
      date: milestones.date,
      status: milestones.status,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(milestones)
    .leftJoin(projects, eq(milestones.projectId, projects.id))
    .where(sql`${milestones.date} >= ${startDate} AND ${milestones.date} <= ${endDate}`)
    .all();

  for (const row of milestoneRows) {
    if (row.date) {
      events.push({
        id: `milestone-${row.id}`,
        type: "milestone",
        title: row.title,
        date: row.date.split("T")[0].split(" ")[0],
        projectName: row.projectName ?? "",
        projectSlug: row.projectSlug ?? "",
        metadata: {
          status: row.status ?? "planned",
        },
      });
    }
  }

  // Git Snapshots — lastCommitDate (dedup by project, use as "commit" events)
  const commitRows = db
    .select({
      id: gitSnapshots.id,
      lastCommitMsg: gitSnapshots.lastCommitMsg,
      lastCommitDate: gitSnapshots.lastCommitDate,
      branch: gitSnapshots.branch,
      totalCommits: gitSnapshots.totalCommits,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(gitSnapshots)
    .leftJoin(projects, eq(gitSnapshots.projectId, projects.id))
    .where(
      sql`${gitSnapshots.lastCommitDate} >= ${startDate} AND ${gitSnapshots.lastCommitDate} <= ${endDate} || ' 23:59:59'`
    )
    .all();

  // Dedup by projectSlug+date
  const seenCommits = new Set<string>();
  for (const row of commitRows) {
    const date = row.lastCommitDate ? row.lastCommitDate.split("T")[0].split(" ")[0] : null;
    if (!date) continue;
    const key = `${row.projectSlug}-${date}`;
    if (seenCommits.has(key)) continue;
    seenCommits.add(key);
    events.push({
      id: `commit-${row.id}`,
      type: "commit",
      title: row.lastCommitMsg ?? "Git commit",
      date,
      projectName: row.projectName ?? "",
      projectSlug: row.projectSlug ?? "",
      metadata: {
        branch: row.branch ?? "",
        totalCommits: String(row.totalCommits ?? 0),
      },
    });
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  // Stats summary
  const stats = {
    issuesCreated: events.filter((e) => e.type === "issue").length,
    issuesResolved: events.filter((e) => e.type === "issue-resolved").length,
    releasesPublished: events.filter((e) => e.type === "release").length,
    feedbackReceived: events.filter((e) => e.type === "feedback").length,
  };

  return Response.json({ events, stats });
}
