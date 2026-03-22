import { readdirSync, statSync, existsSync } from "fs";
import { resolve, basename } from "path";
import simpleGit from "simple-git";

export interface ScannedRepo {
  name: string;
  path: string;
  branch: string;
  lastCommitHash: string;
  lastCommitMsg: string;
  lastCommitDate: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  totalCommits: number;
  remoteUrl: string;
}

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "vendor",
  "dist",
  ".next",
  "__pycache__",
]);

export async function scanGitRepos(
  rootPaths: string[],
  maxDepth = 4
): Promise<ScannedRepo[]> {
  const seen = new Set<string>();
  const repoPaths: string[] = [];

  for (const root of rootPaths) {
    const resolved = resolve(root);
    collectGitRepos(resolved, 0, maxDepth, repoPaths, seen);
  }

  const repos: ScannedRepo[] = [];
  for (const repoPath of repoPaths) {
    try {
      const info = await extractRepoInfo(repoPath);
      repos.push(info);
    } catch {
      // skip repos that can't be read
    }
  }

  return repos;
}

function collectGitRepos(
  dir: string,
  depth: number,
  maxDepth: number,
  results: string[],
  seen: Set<string>
): void {
  if (depth > maxDepth) return;

  const resolved = resolve(dir);
  if (seen.has(resolved)) return;
  seen.add(resolved);

  // Check if this directory is a git repo
  const gitDir = resolve(dir, ".git");
  if (existsSync(gitDir)) {
    results.push(resolved);
    return; // don't recurse into git repos
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    // Skip hidden dirs and excluded dirs
    if (entry.startsWith(".") || EXCLUDE_DIRS.has(entry)) continue;

    const full = resolve(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        collectGitRepos(full, depth + 1, maxDepth, results, seen);
      }
    } catch {
      // skip entries that can't be stat'd
    }
  }
}

async function extractRepoInfo(repoPath: string): Promise<ScannedRepo> {
  const git = simpleGit(repoPath);

  const [status, log, remotes] = await Promise.all([
    git.status(),
    git.log({ maxCount: 1 }).catch(() => null),
    git.getRemotes(true).catch(() => []),
  ]);

  let totalCommits = 0;
  try {
    const count = await git.raw(["rev-list", "--count", "HEAD"]);
    totalCommits = parseInt(count.trim(), 10) || 0;
  } catch {
    // empty repo or no commits
  }

  const remoteUrl =
    remotes.find((r) => r.name === "origin")?.refs?.fetch ?? "";

  const latestCommit = log?.latest;

  return {
    name: basename(repoPath),
    path: repoPath,
    branch: status.current ?? "unknown",
    lastCommitHash: latestCommit?.hash ?? "",
    lastCommitMsg: latestCommit?.message ?? "",
    lastCommitDate: latestCommit?.date ?? "",
    isDirty: !status.isClean(),
    ahead: status.ahead,
    behind: status.behind,
    totalCommits,
    remoteUrl,
  };
}
