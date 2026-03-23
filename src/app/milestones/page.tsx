"use client";

import { useEffect, useState } from "react";
import {
  LuPlus,
  LuFlag,
  LuRocket,
  LuRefreshCw,
  LuLightbulb,
  LuPlugZap,
  LuCheck,
  LuCircleDot,
  LuCircle,
} from "react-icons/lu";
import { MilestoneEditor, type Milestone } from "@/components/milestone-editor";

interface Project {
  id: number;
  name: string;
}

// Map icon field → lucide icon component
function MilestoneIcon({
  icon,
  className,
}: {
  icon: string | null;
  className?: string;
}) {
  const cls = className ?? "w-5 h-5";
  switch (icon) {
    case "launch":
      return <LuRocket className={cls} />;
    case "pivot":
      return <LuRefreshCw className={cls} />;
    case "idea":
      return <LuLightbulb className={cls} />;
    case "integration":
      return <LuPlugZap className={cls} />;
    default:
      return <LuFlag className={cls} />;
  }
}

// Status pill
function StatusPill({ status }: { status: Milestone["status"] }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <LuCheck className="w-3 h-3" />
        Completed
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#c6e135]/30 text-[#5a6b00]">
        <LuCircleDot className="w-3 h-3" />
        Current
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <LuCircle className="w-3 h-3" />
      Planned
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Node color by status
function nodeColorClass(status: Milestone["status"]) {
  if (status === "completed") return "bg-emerald-500 text-white";
  if (status === "current") return "bg-[#c6e135] text-[#1a1a1a]";
  return "bg-gray-200 text-gray-500";
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState<string>("all");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [msRes, prRes] = await Promise.all([
          fetch("/api/milestones"),
          fetch("/api/projects"),
        ]);
        const msData: Milestone[] = await msRes.json();
        const prData: Project[] = await prRes.json();
        setMilestones(msData);
        setProjects(prData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openCreate() {
    setEditingMilestone(null);
    setEditorOpen(true);
  }

  function openEdit(ms: Milestone) {
    setEditingMilestone(ms);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingMilestone(null);
  }

  function handleSaved(saved: Milestone) {
    setMilestones((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        // Re-sort by date
        return next.sort((a, b) => a.date.localeCompare(b.date));
      }
      return [...prev, saved].sort((a, b) => a.date.localeCompare(b.date));
    });
    closeEditor();
  }

  function handleDeleted(id: number) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    closeEditor();
  }

  const filtered =
    filterProjectId === "all"
      ? milestones
      : milestones.filter((m) => m.projectId === Number(filterProjectId));

  const completed = filtered.filter((m) => m.status === "completed").length;
  const current = filtered.filter((m) => m.status === "current").length;
  const planned = filtered.filter((m) => m.status === "planned").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Milestones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track key events and goals across your projects
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
        >
          <LuPlus className="w-4 h-4" />
          New Milestone
        </button>
      </div>

      {/* Stats row */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <LuCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{completed}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c6e135]/30 rounded-full flex items-center justify-center">
              <LuCircleDot className="w-4 h-4 text-[#5a6b00]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{current}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <LuCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Planned</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{planned}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="bg-white rounded-full px-4 py-2 shadow-sm text-sm text-[#1a1a1a] outline-none cursor-pointer"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {loading ? "Loading..." : `${filtered.length} milestone${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Loading milestones...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <LuFlag className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">No milestones yet</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
          >
            <LuPlus className="w-4 h-4" />
            Add First Milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-0">
            {filtered.map((ms, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={ms.id} className="relative flex items-start gap-0 mb-8">
                  {/* Node on the left spine */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${nodeColorClass(ms.status)}`}
                    >
                      <MilestoneIcon icon={ms.icon} className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Connector line from node to card */}
                  <div
                    className={`self-center shrink-0 h-0.5 bg-gray-200 ${isLeft ? "w-6" : "w-6"}`}
                  />

                  {/* Card */}
                  <button
                    onClick={() => openEdit(ms)}
                    className="flex-1 bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-[#1a1a1a] group-hover:text-[#5a6b00] transition-colors truncate">
                            {ms.title}
                          </span>
                          <StatusPill status={ms.status} />
                        </div>
                        {ms.projectName && (
                          <p className="text-xs text-[#c6e135] font-medium mb-1">
                            {ms.projectName}
                          </p>
                        )}
                        {ms.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {ms.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                          {formatDate(ms.date)}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone editor drawer */}
      {editorOpen && (
        <MilestoneEditor
          milestone={editingMilestone}
          projects={projects}
          defaultProjectId={
            filterProjectId !== "all" ? Number(filterProjectId) : undefined
          }
          onClose={closeEditor}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
