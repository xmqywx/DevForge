---
name: df-release
description: Create a new release/changelog entry for current project
---

## DevForge Release

1. Detect current project
2. Analyze what was done in recent commits/session
3. Ask for version number (suggest based on last version + changes severity)
4. Generate changelog in markdown format:
   - ## What's New (features)
   - ## Bug Fixes
   - ## Changes
   - ## Breaking Changes (if any)
5. Use MCP tool `devforge_add_release` to save
6. Confirm: "Release {version} published: {title}"
