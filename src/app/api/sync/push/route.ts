import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  projects,
  issues,
  notes,
  releases,
  milestones,
  gitSnapshots,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

export async function POST() {
  try {
    // Only push public projects
    const publicProjects = db
      .select()
      .from(projects)
      .where(eq(projects.isPublic, true))
      .all();

    if (publicProjects.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "No public projects to push.",
        stats: { projects: 0, issues: 0, notes: 0, releases: 0, milestones: 0, snapshots: 0 },
      });
    }

    const projectIds = publicProjects.map((p) => p.id);

    const allIssues = db.select().from(issues).all().filter((i) => projectIds.includes(i.projectId));
    const allNotes = db.select().from(notes).all().filter((n) => projectIds.includes(n.projectId));
    const allReleases = db.select().from(releases).all().filter((r) => projectIds.includes(r.projectId));
    const allMilestones = db.select().from(milestones).all().filter((m) => projectIds.includes(m.projectId));
    const allSnapshots = db.select().from(gitSnapshots).all().filter((g) => projectIds.includes(g.projectId));

    const body = {
      projects: publicProjects,
      issues: allIssues,
      notes: allNotes,
      releases: allReleases,
      milestones: allMilestones,
      git_snapshots: allSnapshots,
    };

    const res = await fetch(`${SERVER_URL}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": SYNC_SECRET,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Push failed (${res.status}): ${text}`);
    }

    const result = await res.json();
    const stats = result.stats ?? {
      projects: publicProjects.length,
      issues: allIssues.length,
      notes: allNotes.length,
      releases: allReleases.length,
      milestones: allMilestones.length,
      snapshots: allSnapshots.length,
    };

    return NextResponse.json({
      success: true,
      summary: `Pushed ${publicProjects.length} projects, ${allIssues.length} issues, ${allNotes.length} notes`,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
