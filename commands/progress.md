---
name: progress
description: Update project progress percentage, phase, or stage
---

## DevForge Progress

Parse user input:
- `/devforge:progress 60%` -- update progress_pct to 60
- `/devforge:progress phase 3` -- update progress_phase to "Phase 3/5"
- `/devforge:progress stage beta` -- update stage

Use MCP tool `devforge_update_progress`. Confirm the update.
