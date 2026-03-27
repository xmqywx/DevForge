"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGripVertical } from "react-icons/lu";
import { useI18n } from "@/lib/i18n";

export interface KanbanIssue {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  source: string;
  feedbackId: string | null;
  dependsOn: string[] | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  projectName?: string;
  projectSlug?: string;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-[#ef4444]",
  medium: "bg-[#eab308]",
  low: "bg-[#9ca3af]",
};

const TYPE_BADGE: Record<string, string> = {
  bug: "bg-red-100 text-red-700",
  feature: "bg-purple-100 text-purple-700",
  improvement: "bg-blue-100 text-blue-700",
  question: "bg-orange-100 text-orange-700",
  task: "bg-gray-100 text-gray-600",
  note: "bg-yellow-100 text-yellow-700",
};

interface KanbanCardProps {
  issue: KanbanIssue;
  onClick: (issue: KanbanIssue) => void;
}

export function KanbanCard({ issue, onClick }: KanbanCardProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => onClick(issue)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <LuGripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a1a] leading-snug line-clamp-2">
            {issue.title}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[issue.priority] ?? PRIORITY_DOT.medium}`}
              title={`${t("issues.fieldPriority")}: ${t(`priority.${issue.priority}`)}`}
            />
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[issue.type] ?? TYPE_BADGE.task}`}
            >
              {t(`type.${issue.type}`)}
            </span>
            {issue.projectName && (
              <span className="text-xs text-gray-400 truncate">
                {issue.projectName}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">#{issue.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
