"use client";

import { useI18n } from "@/lib/i18n";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { KanbanCard, KanbanIssue } from "./kanban-card";

interface Column {
  id: string;
  label: string;
  statuses: string[];
  accentClass: string;
}

const COLUMNS: Column[] = [
  {
    id: "open",
    label: "issues.open",
    statuses: ["open"],
    accentClass: "border-gray-300 text-gray-600",
  },
  {
    id: "in-progress",
    label: "issues.inProgress",
    statuses: ["in-progress"],
    accentClass: "border-[#c6e135] text-[#1a1a1a]",
  },
  {
    id: "done",
    label: "issues.done",
    statuses: ["resolved"],
    accentClass: "border-emerald-400 text-emerald-700",
  },
  {
    id: "closed",
    label: "issues.closed",
    statuses: ["closed", "wont-fix", "deferred"],
    accentClass: "border-gray-400 text-gray-500",
  },
];

// Map from column id to the status to assign when dropping
const COLUMN_STATUS: Record<string, string> = {
  open: "open",
  "in-progress": "in-progress",
  done: "resolved",
  closed: "closed",
};

function DroppableColumn({
  column,
  issues,
  onCardClick,
}: {
  column: Column;
  issues: KanbanIssue[];
  onCardClick: (issue: KanbanIssue) => void;
}) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[200px] rounded-xl p-2 transition-colors ${
        isOver ? "bg-gray-100" : "bg-[#f0f0e8]/60"
      }`}
    >
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {issues.map((issue) => (
          <KanbanCard key={issue.id} issue={issue} onClick={onCardClick} />
        ))}
      </SortableContext>
      {issues.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400">{t("issues.dropHere")}</p>
        </div>
      )}
    </div>
  );
}

interface KanbanBoardProps {
  issues: KanbanIssue[];
  onCardClick: (issue: KanbanIssue) => void;
  onStatusChange: (issueId: string, newStatus: string) => Promise<void>;
}

export function KanbanBoard({
  issues,
  onCardClick,
  onStatusChange,
}: KanbanBoardProps) {
  const { t } = useI18n();
  const [activeIssue, setActiveIssue] = useState<KanbanIssue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Build column → issues mapping
  const columnIssues: Record<string, KanbanIssue[]> = {
    open: [],
    "in-progress": [],
    done: [],
    closed: [],
  };

  for (const issue of issues) {
    if (issue.status === "open") columnIssues["open"].push(issue);
    else if (issue.status === "in-progress") columnIssues["in-progress"].push(issue);
    else if (issue.status === "resolved") columnIssues["done"].push(issue);
    else if (["closed", "wont-fix", "deferred"].includes(issue.status))
      columnIssues["closed"].push(issue);
  }

  function getColumnForIssue(issueId: string): string | null {
    for (const [colId, colIssues] of Object.entries(columnIssues)) {
      if (colIssues.some((i) => i.id === issueId)) return colId;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const issue = issues.find((i) => i.id === event.active.id);
    if (issue) setActiveIssue(issue);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = over.id;

    // Determine target column
    let targetColumnId: string | null = null;

    // Check if dropped on a column droppable
    if (typeof overId === "string" && COLUMN_STATUS[overId] !== undefined) {
      targetColumnId = overId;
    } else {
      // Dropped on another card — find that card's column
      const overIssueId = String(overId);
      targetColumnId = getColumnForIssue(overIssueId);
    }

    if (!targetColumnId) return;

    const sourceColumnId = getColumnForIssue(activeId);
    if (!sourceColumnId || sourceColumnId === targetColumnId) return;

    const newStatus = COLUMN_STATUS[targetColumnId];
    onStatusChange(activeId, newStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold border-b-2 pb-0.5 ${column.accentClass}`}
                >
                  {t(column.label)}
                </span>
              </div>
              <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 shadow-sm">
                {columnIssues[column.id].length}
              </span>
            </div>
            <DroppableColumn
              column={column}
              issues={columnIssues[column.id]}
              onCardClick={onCardClick}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="rotate-2 scale-105">
            <KanbanCard issue={activeIssue} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
