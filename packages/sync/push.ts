import { db } from "../../src/db/client";
import { projects, issues, notes, releases, milestones, gitSnapshots } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { SyncConfig, PushResult, SyncPayload } from "./types";
import { saveSyncStatus } from "./status";

/**
 * Convert UUID string to a stable positive integer for servers still using INTEGER IDs.
 * Uses first 7 hex chars → 28-bit integer (max ~268M, safely within SQLite INTEGER range).
 * Deterministic: same UUID always → same integer.
 */
function uuidToInt(uuid: string): number {
  const hex = uuid.replace(/-/g, "").slice(0, 7);
  return parseInt(hex, 16);
}

/**
 * Transform a payload from UUID string IDs to integer IDs for server compatibility.
 * Builds a UUID→int mapping, then rewrites all id and foreign key fields.
 */
function transformPayloadForServer(payload: SyncPayload): SyncPayload {
  // Build UUID→int map for all entities
  const idMap = new Map<string, number>();
  const mapId = (uuid: string): number => {
    if (!idMap.has(uuid)) idMap.set(uuid, uuidToInt(uuid));
    return idMap.get(uuid)!;
  };

  const mapRows = (rows: any[] | undefined, fkFields: string[] = []) => {
    if (!rows) return undefined;
    return rows.map((row) => {
      const mapped: any = { ...row };
      // Map primary key
      if (typeof mapped.id === "string") mapped.id = mapId(mapped.id);
      // Map foreign keys
      for (const fk of fkFields) {
        if (typeof mapped[fk] === "string" && mapped[fk]) {
          mapped[fk] = mapId(mapped[fk]);
        }
      }
      // Map dependsOn array (issue dependencies)
      if (Array.isArray(mapped.dependsOn)) {
        mapped.dependsOn = JSON.stringify(
          mapped.dependsOn.map((dep: string) => (typeof dep === "string" ? mapId(dep) : dep))
        );
      } else if (typeof mapped.depends_on === "string") {
        try {
          const deps = JSON.parse(mapped.depends_on);
          mapped.depends_on = JSON.stringify(
            Array.isArray(deps) ? deps.map((d: string) => (typeof d === "string" ? mapId(d) : d)) : deps
          );
        } catch { /* keep as-is */ }
      }
      return mapped;
    });
  };

  return {
    projects: mapRows(payload.projects),
    issues: mapRows(payload.issues, ["projectId", "project_id", "feedbackId", "feedback_id"]),
    notes: mapRows(payload.notes, ["projectId", "project_id"]),
    releases: mapRows(payload.releases, ["projectId", "project_id"]),
    milestones: mapRows(payload.milestones, ["projectId", "project_id"]),
    git_snapshots: mapRows(payload.git_snapshots, ["projectId", "project_id"]),
  };
}

/**
 * Push all local-master data to the server.
 * Only pushes public projects and their associated data.
 * Transforms UUID IDs to integers for server compatibility.
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

    // Transform UUIDs → integers for server compatibility
    const serverPayload = transformPayloadForServer(localPayload);

    const res = await fetch(`${url}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify(serverPayload),
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

    const serverPayload = transformPayloadForServer(localPayload);

    fetch(`${config.server.url}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": config.server.syncSecret,
      },
      body: JSON.stringify(serverPayload),
    }).catch(() => {});
  } catch {
    // Best-effort
  }
}
