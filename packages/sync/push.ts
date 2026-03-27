import { db } from "../../src/db/client";
import { projects, issues, notes, releases, milestones, gitSnapshots } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { SyncConfig, PushResult, SyncPayload } from "./types";
import { saveSyncStatus } from "./status";

/**
 * Push all local-master data to the server.
 * Only pushes public projects and their associated data.
 */
export async function pushToServer(config: SyncConfig): Promise<PushResult> {
  const { url, syncSecret } = config.server;

  try {
    const publicProjects = db.select().from(projects).where(eq(projects.isPublic, true)).all();

    if (publicProjects.length === 0) {
      saveSyncStatus("push", "ok", "No public projects to push");
      return { success: true, counts: {} };
    }

    const projectIds = publicProjects.map(p => p.id);

    const allIssues = projectIds.flatMap(pid =>
      db.select().from(issues).where(eq(issues.projectId, pid)).all()
    );
    const allNotes = projectIds.flatMap(pid =>
      db.select().from(notes).where(eq(notes.projectId, pid)).all()
    );
    const allReleases = projectIds.flatMap(pid =>
      db.select().from(releases).where(eq(releases.projectId, pid)).all()
    );
    const allMilestones = projectIds.flatMap(pid =>
      db.select().from(milestones).where(eq(milestones.projectId, pid)).all()
    );
    const allSnapshots = projectIds.flatMap(pid =>
      db.select().from(gitSnapshots).where(eq(gitSnapshots.projectId, pid)).all()
    );

    const localPayload: SyncPayload = {
      projects: publicProjects,
      issues: allIssues,
      notes: allNotes,
      releases: allReleases,
      milestones: allMilestones,
      git_snapshots: allSnapshots,
    };

    const res = await fetch(`${url}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify(localPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      saveSyncStatus("push", "error", `Server returned ${res.status}: ${errText}`);
      return { success: false, error: errText };
    }

    await res.json().catch(() => ({}));
    const counts = {
      projects: publicProjects.length,
      issues: allIssues.length,
      notes: allNotes.length,
      releases: allReleases.length,
      milestones: allMilestones.length,
      git_snapshots: allSnapshots.length,
    };

    saveSyncStatus("push", "ok", `Pushed ${publicProjects.length} projects, ${allIssues.length} issues`);
    return { success: true, counts };

  } catch (err: any) {
    saveSyncStatus("push", "error", err.message ?? "Push failed");
    return { success: false, error: err.message };
  }
}

/**
 * Push a single project and all its related data.
 * Fire-and-forget version for auto-sync after writes.
 */
export function pushProject(config: SyncConfig, projectId: string): void {
  try {
    const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project?.isPublic) return;

    const localPayload: SyncPayload = {
      projects: [project],
      issues: db.select().from(issues).where(eq(issues.projectId, projectId)).all(),
      notes: db.select().from(notes).where(eq(notes.projectId, projectId)).all(),
      releases: db.select().from(releases).where(eq(releases.projectId, projectId)).all(),
      milestones: db.select().from(milestones).where(eq(milestones.projectId, projectId)).all(),
      git_snapshots: db.select().from(gitSnapshots).where(eq(gitSnapshots.projectId, projectId)).all(),
    };

    fetch(`${config.server.url}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": config.server.syncSecret,
      },
      body: JSON.stringify(localPayload),
    }).catch(() => {});
  } catch {
    // Best-effort
  }
}
