import { db } from "@/db/client";
import { projects, gitSnapshots } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scanGitRepos } from "@/lib/scanner";
import { homedir } from "os";
import { resolve } from "path";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function seedFromScan(
  scanPaths?: string[]
): Promise<{ total: number; created: number; updated: number }> {
  const paths = scanPaths ?? [resolve(homedir(), "Documents")];
  const repos = await scanGitRepos(paths);

  let created = 0;
  let updated = 0;

  for (const repo of repos) {
    const slug = toSlug(repo.name);

    const existing = db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .get();

    let projectId: number;

    if (!existing) {
      const result = db
        .insert(projects)
        .values({
          slug,
          name: repo.name,
          repoPath: repo.path,
          githubUrl: repo.remoteUrl || null,
        })
        .returning({ id: projects.id })
        .get();

      projectId = result.id;
      created++;
    } else {
      projectId = existing.id;
      updated++;
    }

    db.insert(gitSnapshots)
      .values({
        projectId,
        branch: repo.branch,
        lastCommitHash: repo.lastCommitHash,
        lastCommitMsg: repo.lastCommitMsg,
        lastCommitDate: repo.lastCommitDate,
        isDirty: repo.isDirty,
        ahead: repo.ahead,
        behind: repo.behind,
        totalCommits: repo.totalCommits,
      })
      .run();
  }

  return { total: repos.length, created, updated };
}
