import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projects, issues, notes, releases, feedback } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // --- Stats ---
    const totalProjects =
      db.select({ count: sql<number>`count(*)` }).from(projects).get()?.count ?? 0;

    const publicProjects =
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.isPublic, true))
        .get()?.count ?? 0;

    const openIssues =
      db
        .select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(inArray(issues.status, ["open", "in-progress"]))
        .get()?.count ?? 0;

    const unreadFeedback =
      db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(eq(feedback.status, "open"))
        .get()?.count ?? 0;

    // --- Recent Activity ---
    // Get project name map for lookups
    const allProjects = db.select({ id: projects.id, name: projects.name, slug: projects.slug }).from(projects).all();
    const projectMap = new Map(allProjects.map((p) => [p.id, { name: p.name, slug: p.slug }]));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);

    // Recent issues
    const recentIssues = db
      .select({
        id: issues.id,
        title: issues.title,
        type: issues.type,
        projectId: issues.projectId,
        createdAt: issues.createdAt,
      })
      .from(issues)
      .where(sql`${issues.createdAt} >= ${sevenDaysAgo}`)
      .orderBy(desc(issues.createdAt))
      .limit(10)
      .all();

    // Recent feedback
    const recentFeedback = db
      .select({
        id: feedback.id,
        title: feedback.title,
        type: feedback.type,
        projectId: feedback.projectId,
        createdAt: feedback.createdAt,
      })
      .from(feedback)
      .orderBy(desc(feedback.createdAt))
      .limit(10)
      .all();

    // Recent releases
    const recentReleases = db
      .select({
        id: releases.id,
        title: releases.title,
        version: releases.version,
        projectId: releases.projectId,
        createdAt: releases.createdAt,
      })
      .from(releases)
      .orderBy(desc(releases.createdAt))
      .limit(10)
      .all();

    // Recent notes
    const recentNotes = db
      .select({
        id: notes.id,
        title: notes.title,
        projectId: notes.projectId,
        createdAt: notes.createdAt,
      })
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(10)
      .all();

    // Build unified activity list
    type ActivityItem = {
      id: string;
      type: "issue" | "feedback" | "release" | "note";
      subtype?: string;
      title: string;
      projectName: string;
      projectSlug: string;
      createdAt: string;
    };

    const activity: ActivityItem[] = [];

    for (const item of recentIssues) {
      const proj = projectMap.get(item.projectId);
      activity.push({
        id: `issue-${item.id}`,
        type: "issue",
        subtype: item.type ?? "task",
        title: item.title,
        projectName: proj?.name ?? "Unknown",
        projectSlug: proj?.slug ?? "",
        createdAt: item.createdAt ?? "",
      });
    }

    for (const item of recentFeedback) {
      const proj = projectMap.get(item.projectId);
      activity.push({
        id: `feedback-${item.id}`,
        type: "feedback",
        subtype: item.type ?? "feature",
        title: item.title,
        projectName: proj?.name ?? "Unknown",
        projectSlug: proj?.slug ?? "",
        createdAt: item.createdAt ?? "",
      });
    }

    for (const item of recentReleases) {
      const proj = projectMap.get(item.projectId);
      activity.push({
        id: `release-${item.id}`,
        type: "release",
        subtype: item.version,
        title: item.title,
        projectName: proj?.name ?? "Unknown",
        projectSlug: proj?.slug ?? "",
        createdAt: item.createdAt ?? "",
      });
    }

    for (const item of recentNotes) {
      const proj = projectMap.get(item.projectId);
      activity.push({
        id: `note-${item.id}`,
        type: "note",
        title: item.title,
        projectName: proj?.name ?? "Unknown",
        projectSlug: proj?.slug ?? "",
        createdAt: item.createdAt ?? "",
      });
    }

    // Sort by date desc, take top 20
    activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const recentActivity = activity.slice(0, 20);

    return NextResponse.json({
      stats: {
        totalProjects,
        publicProjects,
        openIssues,
        unreadFeedback,
      },
      recentActivity,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
