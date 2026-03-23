---
name: df-scan
description: Scan git repos and sync README files to DevForge database
---

## DevForge Scan

Re-scan all git repositories under ~/Documents and update project data.

Run:
```bash
cd /Users/ying/Documents/DevForge && npx tsx cli/index.ts scan
```

This will:
- Discover new git repos
- Update git snapshots (branch, commits, dirty status)
- Sync README.md files into the database

After scanning, sync to server:
```bash
cd /Users/ying/Documents/DevForge && npx tsx scripts/sync.ts push
```
