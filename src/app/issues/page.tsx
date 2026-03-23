"use client";

import { useEffect, useState, useCallback } from "react";
import { LuSearch, LuPlus, LuX, LuChevronRight } from "react-icons/lu";
import { KanbanBoard } from "@/components/kanban-board";
import { KanbanIssue } from "@/components/kanban-card";
import { IssueCreateDialog } from "@/components/issue-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: number;
  name: string;
  slug: string;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-[#ef4444]",
  medium: "bg-[#eab308]",
  low: "bg-[#9ca3af]",
};

const TYPE_LABELS = ["bug", "feature", "improvement", "question", "task", "note"];
const PRIORITY_LABELS = ["high", "medium", "low"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Issue Detail Drawer
function IssueDrawer({
  issue,
  projects,
  onClose,
  onUpdated,
}: {
  issue: KanbanIssue;
  projects: Project[];
  onClose: () => void;
  onUpdated: (updated: KanbanIssue) => void;
}) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [type, setType] = useState(issue.type);
  const [priority, setPriority] = useState(issue.priority);
  const [status, setStatus] = useState(issue.status);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Reset when issue changes
  useEffect(() => {
    setTitle(issue.title);
    setDescription(issue.description ?? "");
    setType(issue.type);
    setPriority(issue.priority);
    setStatus(issue.status);
    setSaveMsg("");
  }, [issue.id]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, type, priority, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onUpdated(updated);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const projectName =
    issue.projectName ??
    projects.find((p) => p.id === issue.projectId)?.name ??
    `Project #${issue.projectId}`;

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col pointer-events-auto h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-[#c6e135] font-medium">{projectName}</span>
            <LuChevronRight className="w-3 h-3" />
            <span>#{issue.id}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add details..."
            />
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["open", "in-progress", "resolved", "closed", "wont-fix", "deferred"].map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/-/g, " ")}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_LABELS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LABELS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
            <div>
              <span className="font-medium">Source:</span>{" "}
              <span className="capitalize">{issue.source}</span>
            </div>
            <div>
              <span className="font-medium">Created:</span>{" "}
              {formatDate(issue.createdAt)}
            </div>
            {issue.resolvedAt && (
              <div>
                <span className="font-medium">Resolved:</span>{" "}
                {formatDate(issue.resolvedAt)}
              </div>
            )}
            {issue.dependsOn && issue.dependsOn.length > 0 && (
              <div>
                <span className="font-medium">Depends on:</span>{" "}
                {issue.dependsOn.map((id) => `#${id}`).join(", ")}
              </div>
            )}
          </div>

          {/* Comments placeholder */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Comments</p>
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
              Comments will be loaded from the server in Task 5.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
          {saveMsg && (
            <span
              className={`text-sm ${saveMsg === "Saved!" ? "text-emerald-600" : "text-red-500"}`}
            >
              {saveMsg}
            </span>
          )}
          {!saveMsg && <span />}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#c6e135] text-[#1a1a1a] hover:brightness-95"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<KanbanIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // UI state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<KanbanIssue | null>(null);

  // Fetch projects + issues
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [issuesRes, projectsRes] = await Promise.all([
          fetch("/api/issues"),
          fetch("/api/projects"),
        ]);
        const issuesData: KanbanIssue[] = await issuesRes.json();
        const projectsData: Project[] = await projectsRes.json();

        // Attach project names to issues
        const projectMap = new Map(projectsData.map((p) => [p.id, p]));
        const enriched = issuesData.map((issue) => ({
          ...issue,
          projectName: projectMap.get(issue.projectId)?.name,
          projectSlug: projectMap.get(issue.projectId)?.slug,
        }));

        setIssues(enriched);
        setProjects(projectsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = useCallback(
    async (issueId: number, newStatus: string) => {
      // Optimistic update
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );
      try {
        const res = await fetch(`/api/issues/${issueId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("PATCH failed");
        const updated: KanbanIssue = await res.json();
        setIssues((prev) =>
          prev.map((i) => (i.id === issueId ? { ...i, ...updated } : i))
        );
      } catch {
        // Revert on failure
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId ? { ...i, status: i.status } : i
          )
        );
      }
    },
    []
  );

  const handleIssueUpdated = useCallback((updated: KanbanIssue) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
    // If the drawer issue is the same, update it
    setSelectedIssue((prev) =>
      prev?.id === updated.id ? { ...prev, ...updated } : prev
    );
  }, []);

  const handleIssueCreated = useCallback(
    (created: Record<string, unknown>) => {
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      const issue = created as unknown as KanbanIssue;
      const enriched: KanbanIssue = {
        ...issue,
        projectName: projectMap.get(issue.projectId)?.name,
        projectSlug: projectMap.get(issue.projectId)?.slug,
      };
      setIssues((prev) => [enriched, ...prev]);
    },
    [projects]
  );

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (
      filterProjectId !== "all" &&
      issue.projectId !== Number(filterProjectId)
    )
      return false;
    if (filterPriority !== "all" && issue.priority !== filterPriority)
      return false;
    if (filterType !== "all" && issue.type !== filterType) return false;
    if (
      searchQuery &&
      !issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Issues</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
        >
          <LuPlus className="w-4 h-4" />
          New Issue
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm flex-1 min-w-[200px] max-w-xs">
          <LuSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="bg-transparent outline-none text-sm text-[#1a1a1a] placeholder:text-gray-400 w-full"
          />
        </div>

        {/* Project filter */}
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

        {/* Priority pills */}
        <div className="flex items-center gap-1.5">
          {["all", ...PRIORITY_LABELS].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterPriority === p
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {p !== "all" && (
                <span
                  className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`}
                />
              )}
              {p === "all" ? "All Priority" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...TYPE_LABELS].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-500">
        {loading
          ? "Loading..."
          : `${filteredIssues.length} issue${filteredIssues.length !== 1 ? "s" : ""}`}
      </div>

      {/* Kanban board */}
      {!loading && (
        <KanbanBoard
          issues={filteredIssues}
          onCardClick={setSelectedIssue}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create issue dialog */}
      <IssueCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projects={projects}
        onCreated={handleIssueCreated}
      />

      {/* Issue detail drawer */}
      {selectedIssue && (
        <IssueDrawer
          issue={selectedIssue}
          projects={projects}
          onClose={() => setSelectedIssue(null)}
          onUpdated={handleIssueUpdated}
        />
      )}
    </div>
  );
}
