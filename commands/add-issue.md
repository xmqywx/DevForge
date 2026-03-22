---
name: add-issue
description: Add an issue to current project
---

## DevForge Add Issue

1. Detect current project from working directory
2. If user provided details inline, extract title/type/priority
3. Otherwise ask for: Title (required), Type (bug/feature/improvement/task, default: task), Priority (high/medium/low, default: medium), Description (optional)
4. Use MCP tool `devforge_add_issue`
5. Confirm: "Issue #{id} created: {title}"
