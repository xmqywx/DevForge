import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { projects, issues, notes, releases, milestones, feedback } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getSyncService } from "../../../../../packages/sync";

export const dynamic = "force-dynamic";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";

export async function GET() {
  // Local counts
  const [projectCount] = db.select({ count: sql<number>`count(*)` }).from(projects).all();
  const [issueCount] = db.select({ count: sql<number>`count(*)` }).from(issues).all();
  const [noteCount] = db.select({ count: sql<number>`count(*)` }).from(notes).all();
  const [releaseCount] = db.select({ count: sql<number>`count(*)` }).from(releases).all();
  const [milestoneCount] = db.select({ count: sql<number>`count(*)` }).from(milestones).all();
  const [feedbackCount] = db.select({ count: sql<number>`count(*)` }).from(feedback).all();

  const localCounts = {
    projects: projectCount.count,
    issues: issueCount.count,
    notes: noteCount.count,
    releases: releaseCount.count,
    milestones: milestoneCount.count,
    feedback: feedbackCount.count,
  };

  // Test server connection
  let serverOnline = false;
  let serverCounts: Record<string, number> | null = null;

  try {
    const res = await fetch(`${SERVER_URL}/api/health`, {
      headers: { "x-sync-secret": SYNC_SECRET },
      signal: AbortSignal.timeout(5000),
    });
    serverOnline = res.ok;

    // Try to get server counts
    const statsRes = await fetch(`${SERVER_URL}/api/stats`, {
      headers: { "x-sync-secret": SYNC_SECRET },
      signal: AbortSignal.timeout(5000),
    });
    if (statsRes.ok) {
      serverCounts = await statsRes.json();
    }
  } catch {
    serverOnline = false;
  }

  // Merge SyncService status with local DB counts and server info
  const syncStatus = getSyncService().status();

  return NextResponse.json({
    ...syncStatus,
    serverOnline,
    serverUrl: SERVER_URL,
    localCounts,
    serverCounts,
  });
}
