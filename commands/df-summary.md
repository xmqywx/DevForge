---
name: df-summary
description: Generate session summary — what was done, issues resolved, new discoveries
---

## DevForge Session Summary

1. Detect current project
2. Analyze current conversation to extract:
   - What was accomplished
   - Issues that were fixed (match against open issues)
   - New bugs/issues discovered
   - Design decisions made
3. For resolved issues: `devforge_update_issue` status=resolved
4. For new issues: `devforge_add_issue`
5. Write session summary note: `devforge_add_note` with source=session-summary
6. Optionally update progress: `devforge_update_progress`
7. Output formatted summary
