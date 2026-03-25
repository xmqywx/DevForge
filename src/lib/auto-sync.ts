/**
 * auto-sync.ts
 *
 * Push local data changes to the remote server after write operations.
 * All pushes are best-effort (fire-and-forget) — network failures are
 * silently swallowed so they never block local responses.
 */

import { db } from "@/db/client";
import { projects, issues, notes, releases, milestones, gitSnapshots } from "@/db/schema";
import { eq } from "drizzle-orm";

const SERVER_URL = process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET = process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

export interface SyncPayload {
  projects?: any[];
  issues?: any[];
  notes?: any[];
  releases?: any[];
  milestones?: any[];
  git_snapshots?: any[];
}

/**
 * Push a partial payload to the server. Fire-and-forget.
 * Only call this after confirming the affected project is public.
 */
export function pushToServer(data: SyncPayload): void {
  fetch(`${SERVER_URL}/api/sync/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify(data),
  }).catch(() => {
    // Best-effort — silently ignore network errors
  });
}

/**
 * Look up whether a project (by id) is public.
 * Returns null if the project doesn't exist.
 */
export function getProjectById(projectId: number) {
  return db.select().from(projects).where(eq(projects.id, projectId)).get() ?? null;
}

/**
 * Build a full sync payload for a single public project and push it.
 * Includes all related issues, notes, releases, milestones, and git snapshots.
 */
export function syncProject(projectId: number): void {
  try {
    const project = getProjectById(projectId);
    if (!project?.isPublic) return;

    const projectIssues    = db.select().from(issues).where(eq(issues.projectId, projectId)).all();
    const projectNotes     = db.select().from(notes).where(eq(notes.projectId, projectId)).all();
    const projectReleases  = db.select().from(releases).where(eq(releases.projectId, projectId)).all();
    const projectMilestones = db.select().from(milestones).where(eq(milestones.projectId, projectId)).all();
    const projectSnapshots  = db.select().from(gitSnapshots).where(eq(gitSnapshots.projectId, projectId)).all();

    pushToServer({
      projects:      [project],
      issues:        projectIssues,
      notes:         projectNotes,
      releases:      projectReleases,
      milestones:    projectMilestones,
      git_snapshots: projectSnapshots,
    });
  } catch {
    // Best-effort
  }
}
