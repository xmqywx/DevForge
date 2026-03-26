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
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

export async function POST(request: Request) {
  // Check if this is an incoming push (from Dashboard → Portal)
  const incomingSecret = request.headers.get("x-sync-secret");
  const contentType = request.headers.get("content-type") ?? "";

  if (incomingSecret && contentType.includes("application/json")) {
    return handleReceive(request, incomingSecret);
  }

  // Otherwise, this is an outgoing push (Dashboard pushing to server)
  return handlePush();
}

// Portal mode: receive data from Dashboard
async function handleReceive(request: Request, secret: string) {
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "Invalid sync secret" }, { status: 401 });
  }

  try {
    const data = await request.json();
    let projectCount = 0, issueCount = 0, noteCount = 0, releaseCount = 0, milestoneCount = 0, snapshotCount = 0;

    // Upsert projects by slug
    if (data.projects) {
      for (const p of data.projects) {
        const existing = db.select().from(projects).where(eq(projects.slug, p.slug)).get();
        if (existing) {
          db.update(projects)
            .set({ ...p, id: existing.id, updatedAt: sql`datetime('now')` })
            .where(eq(projects.id, existing.id))
            .run();
        } else {
          const { id, ...rest } = p;
          db.insert(projects).values({ ...rest, isPublic: true }).run();
        }
        projectCount++;
      }
    }

    // Build a slug→id map for foreign keys
    const slugToId: Record<string, number> = {};
    const oldIdToNewId: Record<number, number> = {};
    if (data.projects) {
      for (const p of data.projects) {
        const row = db.select().from(projects).where(eq(projects.slug, p.slug)).get();
        if (row) {
          slugToId[p.slug] = row.id;
          oldIdToNewId[p.id] = row.id;
        }
      }
    }

    // Upsert issues
    if (data.issues) {
      for (const item of data.issues) {
        const newProjectId = oldIdToNewId[item.projectId];
        if (!newProjectId) continue;
        const existing = db.select().from(issues)
          .where(eq(issues.title, item.title))
          .all()
          .find(i => i.projectId === newProjectId);
        if (!existing) {
          const { id, projectId, ...rest } = item;
          try { db.insert(issues).values({ ...rest, projectId: newProjectId }).run(); issueCount++; } catch { /* skip */ }
        }
      }
    }

    // Upsert notes
    if (data.notes) {
      for (const item of data.notes) {
        const newProjectId = oldIdToNewId[item.projectId];
        if (!newProjectId) continue;
        const existing = db.select().from(notes)
          .where(eq(notes.title, item.title))
          .all()
          .find(n => n.projectId === newProjectId);
        if (!existing) {
          const { id, projectId, ...rest } = item;
          try { db.insert(notes).values({ ...rest, projectId: newProjectId }).run(); noteCount++; } catch { /* skip */ }
        }
      }
    }

    // Upsert releases
    if (data.releases) {
      for (const item of data.releases) {
        const newProjectId = oldIdToNewId[item.projectId];
        if (!newProjectId) continue;
        const existing = db.select().from(releases)
          .where(eq(releases.version, item.version))
          .all()
          .find(r => r.projectId === newProjectId);
        if (!existing) {
          const { id, projectId, ...rest } = item;
          try { db.insert(releases).values({ ...rest, projectId: newProjectId }).run(); releaseCount++; } catch { /* skip */ }
        }
      }
    }

    // Upsert milestones
    if (data.milestones) {
      for (const item of data.milestones) {
        const newProjectId = oldIdToNewId[item.projectId];
        if (!newProjectId) continue;
        const existing = db.select().from(milestones)
          .where(eq(milestones.title, item.title))
          .all()
          .find(m => m.projectId === newProjectId);
        if (!existing) {
          const { id, projectId, ...rest } = item;
          try { db.insert(milestones).values({ ...rest, projectId: newProjectId }).run(); milestoneCount++; } catch { /* skip */ }
        }
      }
    }

    // Upsert git snapshots (replace all for each project)
    if (data.git_snapshots) {
      for (const item of data.git_snapshots) {
        const newProjectId = oldIdToNewId[item.projectId];
        if (!newProjectId) continue;
        const { id, projectId, ...rest } = item;
        try { db.insert(gitSnapshots).values({ ...rest, projectId: newProjectId }).run(); snapshotCount++; } catch { /* skip */ }
      }
    }

    return NextResponse.json({
      success: true,
      stats: { projects: projectCount, issues: issueCount, notes: noteCount, releases: releaseCount, milestones: milestoneCount, snapshots: snapshotCount },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Dashboard mode: push local public projects to server
async function handlePush() {
  try {
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
