---
name: status
description: Show project status — all projects overview or single project detail
---

## DevForge Status

If user specifies a project name, use `devforge_get_project` MCP tool with that slug.
If no project specified, detect from current directory. If still none, use `devforge_list_projects`.

### Single project format:
Show in this structure (no emojis, use text markers):
- [IN PROGRESS] items with count
- [COMPLETED 24h] recently resolved
- [NEXT] actionable items (deps cleared)
- [BLOCKED] items with blocking reason
- [FEEDBACK] new feedback count
- Progress: phase + percentage
