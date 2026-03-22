---
name: df-configure
description: Configure automation settings for current project
---

## DevForge Configure

1. Detect current project
2. Show current automation settings:
   - Auto-record issues: ON / OFF / Default
   - Auto-record notes: ON / OFF / Default
   - Session summary on exit: ON / OFF / Default
   - Auto-load context: ON / OFF / Default
   - Auto-update progress: ON / OFF / Default
3. Ask which to change using AskUserQuestion (multiSelect)
4. Update via PATCH /api/projects/{slug}
5. Confirm changes
