#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
SLUG="${1:-}"
if [ -z "$SLUG" ]; then echo "Usage: next-issue.sh <project-slug>"; exit 1; fi

PROJECT_ID=$(sqlite3 "$DB" "SELECT id FROM projects WHERE slug = '$SLUG'")
if [ -z "$PROJECT_ID" ]; then echo "Project not found"; exit 1; fi

echo ""
echo "  Next Actionable — $SLUG"
echo "  ──────────────────"
sqlite3 -header -column "$DB" "
  SELECT i.id, i.title, i.priority, i.type
  FROM issues i
  WHERE i.project_id = $PROJECT_ID
  AND i.status = 'open'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(i.depends_on) AS dep
    JOIN issues blocked ON blocked.id = dep.value
    WHERE blocked.status NOT IN ('resolved', 'wont-fix')
  )
  ORDER BY CASE i.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END
  LIMIT 5;
"
