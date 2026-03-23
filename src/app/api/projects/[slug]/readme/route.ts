import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

/** GET /api/projects/[slug]/readme — reads README.md from disk (repoPath) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .get();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.repoPath) {
    return Response.json({ error: "Project has no repoPath set" }, { status: 400 });
  }

  const candidates = ["README.md", "readme.md", "Readme.md", "README.MD", "README"];
  for (const name of candidates) {
    const filePath = join(project.repoPath, name);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        return Response.json({ content });
      } catch {
        return Response.json({ error: "Failed to read README file" }, { status: 500 });
      }
    }
  }

  return Response.json({ error: "No README file found in repoPath" }, { status: 404 });
}
