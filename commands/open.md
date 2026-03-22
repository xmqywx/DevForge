---
name: open
description: Open DevForge Dashboard in browser
---

## DevForge Open

1. Check if web server is running: `curl -s http://localhost:3102 > /dev/null 2>&1`
2. If not running: `cd {DEVFORGE_DIR} && npm run dev &`
3. Open browser: `open http://localhost:3102`
