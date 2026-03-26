#!/usr/bin/env npx tsx
import { Command } from "commander";
import { db } from "../src/db/client";
import { projects, issues } from "../src/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getOverviewStats } from "../src/lib/queries";
import { seedFromScan } from "../src/db/seed";
import { getSyncService } from "../packages/sync";

const program = new Command();
program.name("devforge").description("Personal Project Command Center").version("1.0.0");

// devforge status [project]
program.command("status [project]")
  .description("Show project status")
  .action((projectSlug?: string) => {
    if (projectSlug) {
      const project = db.select().from(projects).where(eq(projects.slug, projectSlug)).get();
      if (!project) { console.error(`Project '${projectSlug}' not found`); process.exit(1); }
      const openIssues = db.select().from(issues)
        .where(sql`${issues.projectId} = ${project.id} AND ${issues.status} IN ('open', 'in-progress')`)
        .all();
      console.log(`\n  ${project.name} | ${project.stage} | ${project.progressPct}%`);
      console.log(`  Open issues: ${openIssues.length}`);
      openIssues.forEach(i => console.log(`    [${i.priority}] #${i.id} ${i.title}`));
    } else {
      const stats = getOverviewStats();
      const all = db.select().from(projects)
        .where(inArray(projects.stage, ["dev", "beta", "live", "idea"]))
        .orderBy(desc(projects.updatedAt)).all();
      console.log(`\n  DevForge — ${stats.totalProjects} projects, ${stats.openIssues} open issues\n`);
      const bar = (pct: number) => "█".repeat(Math.floor(pct/10)) + "░".repeat(10 - Math.floor(pct/10));
      all.forEach(p => {
        console.log(`  ${p.name.padEnd(25)} ${(p.stage ?? "").padEnd(8)} ${bar(p.progressPct ?? 0)} ${p.progressPct ?? 0}%`);
      });
    }
  });

// devforge issue add <project> <title>
const issueCmd = program.command("issue").description("Issue management");
issueCmd.command("add <project> <title>")
  .option("-p, --priority <priority>", "high/medium/low", "medium")
  .option("-t, --type <type>", "bug/feature/task", "task")
  .action((projectSlug: string, title: string, opts: any) => {
    const project = db.select().from(projects).where(eq(projects.slug, projectSlug)).get();
    if (!project) { console.error(`Project '${projectSlug}' not found`); process.exit(1); }
    const result = db.insert(issues).values({
      projectId: project.id, title, type: opts.type, priority: opts.priority, source: "manual",
    }).returning().get();
    getSyncService().debouncedPush();
    console.log(`Issue #${result.id} created: ${title}`);
  });

issueCmd.command("list [project]")
  .description("List issues")
  .action((projectSlug?: string) => {
    const project = projectSlug ? db.select().from(projects).where(eq(projects.slug, projectSlug)).get() : null;
    if (projectSlug && !project) { console.error(`Not found`); process.exit(1); }
    const results = db.select().from(issues)
      .where(project
        ? sql`${issues.status} IN ('open', 'in-progress') AND ${issues.projectId} = ${project.id}`
        : sql`${issues.status} IN ('open', 'in-progress')`)
      .orderBy(sql`CASE ${issues.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`).all();
    results.forEach(i => console.log(`  [${i.priority}] #${i.id} ${i.title} (${i.status})`));
    if (results.length === 0) console.log("  No open issues");
  });

issueCmd.command("close <id>")
  .description("Close an issue")
  .action((id: string) => {
    db.update(issues).set({ status: "resolved", resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(issues.id, id)).run();
    getSyncService().debouncedPush();
    console.log(`Issue #${id} resolved`);
  });

// devforge scan
program.command("scan")
  .description("Scan git repos")
  .action(async () => {
    console.log("Scanning...");
    const result = await seedFromScan();
    console.log(`Done: ${result.total} repos, ${result.created} new, ${result.updated} updated`);
  });

// devforge open
program.command("open")
  .description("Open Dashboard in browser")
  .action(() => {
    require("child_process").execSync("open http://localhost:3102");
  });

// devforge sync push|pull|status|both
const syncCmd = program.command("sync").description("Sync with server");

syncCmd.command("push")
  .description("Push local data to server")
  .action(async () => {
    console.log("Pushing to server...");
    try {
      const result = await getSyncService().push();
      if ((result as any).skipped) { console.log("Sync disabled or server URL not set"); return; }
      console.log("Push complete:", JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error("Push failed:", error.message);
    }
  });

syncCmd.command("pull")
  .description("Pull data from server")
  .action(async () => {
    console.log("Pulling from server...");
    try {
      const result = await getSyncService().pull();
      if ((result as any).skipped) { console.log("Sync disabled or server URL not set"); return; }
      console.log("Pull complete:", JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error("Pull failed:", error.message);
    }
  });

syncCmd.command("status")
  .description("Show sync status")
  .action(() => {
    const status = getSyncService().status();
    console.log(JSON.stringify(status, null, 2));
  });

// Legacy: devforge sync [both|push|pull] — keep for backwards compat
syncCmd.command("both", { hidden: true })
  .description("Push and pull (default)")
  .action(async () => {
    console.log("Syncing both directions...");
    try {
      const result = await getSyncService().sync();
      console.log("Sync complete:", JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error("Sync failed:", error.message);
    }
  });

program.parse();
