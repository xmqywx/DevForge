#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
SLUG="${1:-}"
if [ -z "$SLUG" ]; then echo "Usage: blocked.sh <project-slug>"; exit 1; fi

PROJECT_ID=$(sqlite3 "$DB" "SELECT id FROM projects WHERE slug = '$SLUG'")
if [ -z "$PROJECT_ID" ]; then echo "Project not found"; exit 1; fi

echo ""
echo "  Blocked Issues — $SLUG"
echo "  ──────────────────"
sqlite3 -header -column "$DB" "
  SELECT i.id, i.title, blocked.id as blocked_by, blocked.title as blocked_by_title
  FROM issues i, json_each(i.depends_on) AS dep
  JOIN issues blocked ON blocked.id = dep.value
  WHERE i.status = 'open'
  AND i.project_id = $PROJECT_ID
  AND blocked.status NOT IN ('resolved', 'wont-fix');
"
