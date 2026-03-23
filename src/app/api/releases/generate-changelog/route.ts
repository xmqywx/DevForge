import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ error: "projectId required" }, { status: 400 });
  }

  const project = db
    .select()
    .from(projects)
    .where(eq(projects.id, Number(projectId)))
    .get();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.repoPath) {
    return Response.json(
      { error: "Project has no repoPath configured" },
      { status: 400 }
    );
  }

  try {
    const raw = execSync("git log --oneline -20", {
      cwd: project.repoPath,
      encoding: "utf-8",
      timeout: 5000,
    });

    const lines = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        // Strip the short hash prefix (7 chars + space)
        const msg = line.slice(8).trim();
        return `- ${msg}`;
      });

    const changelog = `## What's Changed\n\n${lines.join("\n")}`;

    return Response.json({ changelog });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `git log failed: ${message}` },
      { status: 500 }
    );
  }
}
