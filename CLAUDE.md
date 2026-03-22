@AGENTS.md

# DevForge Auto-Record Rule

When working on ANY project that has DevForge MCP connected:
- If you discover a bug → call `devforge_add_issue` immediately
- If user reports a problem → call `devforge_add_issue` immediately  
- If you fix an issue → call `devforge_update_issue` to mark resolved
- If you make a design decision → call `devforge_add_note`
- At end of session → summarize what was done via `devforge_add_note`

Do NOT wait to be asked. Record proactively.
