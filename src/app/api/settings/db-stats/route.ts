import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  projects,
  issues,
  notes,
  feedback,
  milestones,
  releases,
  settings,
  gitSnapshots,
  feedbackReplies,
  feedbackVotes,
  issueVotes,
  issueComments,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import { statSync, existsSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countTable(table: any): number {
  const row = db.select({ count: sql<number>`count(*)` }).from(table).get() as { count: number } | undefined;
  return row?.count ?? 0;
}

export async function GET() {
  const dbPath = process.env.DB_PATH?.replace("~", homedir())
    ?? resolve(homedir(), ".devforge", "devforge.db");

  let sizeBytes = 0;
  if (existsSync(dbPath)) {
    sizeBytes = statSync(dbPath).size;
  }

  const tables = [
    { name: "projects", count: countTable(projects) },
    { name: "issues", count: countTable(issues) },
    { name: "notes", count: countTable(notes) },
    { name: "feedback", count: countTable(feedback) },
    { name: "milestones", count: countTable(milestones) },
    { name: "releases", count: countTable(releases) },
    { name: "settings", count: countTable(settings) },
    { name: "git_snapshots", count: countTable(gitSnapshots) },
    { name: "feedback_replies", count: countTable(feedbackReplies) },
    { name: "feedback_votes", count: countTable(feedbackVotes) },
    { name: "issue_votes", count: countTable(issueVotes) },
    { name: "issue_comments", count: countTable(issueComments) },
  ];

  return NextResponse.json({ dbPath, sizeBytes, tables });
}
