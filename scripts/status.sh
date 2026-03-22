#!/bin/bash
DB="${HOME}/.devforge/devforge.db"
if [ ! -f "$DB" ]; then echo "DB not found. Run /devforge:init"; exit 1; fi

echo ""
echo "  DevForge Status"
echo "  ──────────────────"
echo "  Projects: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects")"
echo "    Active: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects WHERE stage IN ('dev','beta','live')")"
echo "    Paused: $(sqlite3 "$DB" "SELECT COUNT(*) FROM projects WHERE stage = 'paused'")"
echo ""
echo "  Issues:"
echo "    Open: $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'open'")"
echo "    In Progress: $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'in-progress'")"
echo "    Resolved (7d): $(sqlite3 "$DB" "SELECT COUNT(*) FROM issues WHERE status = 'resolved' AND resolved_at >= datetime('now','-7 days')")"
echo ""
