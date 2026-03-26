"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LuSearch, LuPlus, LuX, LuChevronRight, LuSend } from "react-icons/lu";
import { useI18n } from "@/lib/i18n";
import { KanbanBoard } from "@/components/kanban-board";
import { KanbanIssue } from "@/components/kanban-card";
import { IssueCreateDialog } from "@/components/issue-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Native select used in drawer to avoid portal/overflow z-index issues

const SERVER_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat")
    : "https://forge.wdao.chat";

interface IssueComment {
  id: number | string;
  issueId: number;
  authorName: string;
  isOwner: boolean;
  content: string;
  createdAt: string;
  fromServer?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fixImageUrls(html: string): string {
  // Prefix relative image src paths with the server URL
  return html.replace(
    /(<img[^>]+src=["'])(?!https?:\/\/)([^"']+)(["'])/gi,
    (_, pre, path, quote) => `${pre}${SERVER_URL}${path.startsWith("/") ? "" : "/"}${path}${quote}`
  );
}

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
  const { t } = useI18n();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [type, setType] = useState(issue.type);
  const [priority, setPriority] = useState(issue.priority);
  const [status, setStatus] = useState(issue.status);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [editingDesc, setEditingDesc] = useState(false);

  // Reset when issue changes
  useEffect(() => {
    setTitle(issue.title);
    setDescription(issue.description ?? "");
    setType(issue.type);
    setPriority(issue.priority);
    setStatus(issue.status);
    setSaveMsg("");
  }, [issue.id]);

  // Load comments from local DB (synced from server via WS → auto-pull)
  useEffect(() => {
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);
    fetch(`/api/issues/${issue.id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [issue.id]);

  // Reload comments when WS event triggers sync
  useEffect(() => {
    function handleWSEvent() {
      fetch(`/api/issues/${issue.id}/comments`)
        .then((r) => r.json())
        .then((data) => setComments(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
    window.addEventListener("devforge-ws-event", handleWSEvent);
    return () => window.removeEventListener("devforge-ws-event", handleWSEvent);
  }, [issue.id]);

  async function sendComment() {
    if (!commentText.trim()) return;
    setCommentSending(true);
    try {
      await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText, author_name: "Kris" }),
      });
      setCommentText("");
      const res = await fetch(`/api/issues/${issue.id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      // silent
    } finally {
      setCommentSending(false);
    }
  }

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
      setSaveMsg(t("issues.saved"));
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg(t("issues.saveFailed"));
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
            <Label>{t("issues.fieldTitle")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("issues.fieldDescription")}</Label>
              <button
                type="button"
                onClick={() => setEditingDesc(!editingDesc)}
                className="text-xs text-blue-500 hover:underline"
              >
                {editingDesc ? "预览" : "编辑"}
              </button>
            </div>
            {editingDesc ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={t("issues.addDetails")}
              />
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 min-h-[60px] rendered-html" dangerouslySetInnerHTML={{ __html: fixImageUrls(description || "<span class='text-gray-400'>无描述</span>") }} />
            )}
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("issues.fieldStatus")}</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 capitalize"
              >
                {["open", "in-progress", "resolved", "closed", "wont-fix", "deferred"].map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("issues.fieldType")}</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 capitalize"
              >
                {TYPE_LABELS.map((tp) => (
                  <option key={tp} value={tp}>{t(`type.${tp}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("issues.fieldPriority")}</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 capitalize"
              >
                {PRIORITY_LABELS.map((p) => (
                  <option key={p} value={p}>{t(`priority.${p}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
            <div>
              <span className="font-medium">{t("issues.metaSource")}:</span>{" "}
              <span className="capitalize">{issue.source}</span>
            </div>
            <div>
              <span className="font-medium">{t("issues.metaCreated")}:</span>{" "}
              {formatDate(issue.createdAt)}
            </div>
            {issue.resolvedAt && (
              <div>
                <span className="font-medium">{t("issues.metaResolved")}:</span>{" "}
                {formatDate(issue.resolvedAt)}
              </div>
            )}
            {issue.dependsOn && issue.dependsOn.length > 0 && (
              <div>
                <span className="font-medium">{t("issues.metaDependsOn")}:</span>{" "}
                {issue.dependsOn.map((id) => `#${id}`).join(", ")}
              </div>
            )}
          </div>

          {/* Comments section */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-3">{t("issues.comments")}</p>

            {/* Comments list */}
            {commentsLoading ? (
              <div className="text-center text-sm text-gray-400 py-4">{t("issues.loadingComments")}</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-xl">
                {t("issues.noComments")}
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={String(c.id)} className="flex gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.authorName)}`}
                      alt={c.authorName}
                      className="w-8 h-8 rounded-full shrink-0 bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1a1a1a]">{c.authorName}</span>
                        {c.isOwner && (
                          <span className="text-xs bg-[#c6e135] text-[#1a1a1a] px-1.5 py-0.5 rounded font-medium">
                            Owner
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{relativeTime(c.createdAt)}</span>
                      </div>
                      <div
                        className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: fixImageUrls(c.content) }}
                      />
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Reply input */}
            <div className="mt-4 flex gap-2 items-end">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendComment();
                }}
                placeholder={t("issues.commentPlaceholder")}
                className="flex-1 text-sm border border-input rounded-xl p-2.5 resize-none outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 min-h-[60px]"
                rows={2}
                disabled={commentSending}
              />
              <button
                onClick={sendComment}
                disabled={commentSending || !commentText.trim()}
                className="self-end mb-0 px-3 py-2 bg-[#c6e135] rounded-xl text-sm font-medium text-[#1a1a1a] hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <LuSend className="w-3.5 h-3.5" />
                {commentSending ? t("issues.sending") : t("issues.send")}
              </button>
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
            {saving ? t("issues.saving") : t("issues.saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Searchable project dropdown — supports both typing and clicking
function ProjectCombobox({
  projects,
  value,
  onChange,
  placeholder,
}: {
  projects: Project[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedName =
    value === "all"
      ? ""
      : projects.find((p) => String(p.id) === value)?.name ?? "";

  const filtered = projects.filter(
    (p) =>
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.slug.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative min-w-[180px]">
      <div
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm cursor-pointer"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedName || placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          className={`bg-transparent outline-none text-sm w-full ${
            !open && !selectedName ? "text-[#1a1a1a]" : "text-[#1a1a1a]"
          } ${!open && !selectedName ? "font-normal" : ""} placeholder:text-[#1a1a1a]`}
        />
        <LuSearch className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto z-50">
          {/* All projects option */}
          <button
            onClick={() => {
              onChange("all");
              setOpen(false);
              setQuery("");
            }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
              value === "all" ? "text-[#1a1a1a] font-medium bg-[#c6e135]/20" : "text-gray-600"
            }`}
          >
            {placeholder}
          </button>

          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              No matching projects
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChange(String(p.id));
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  String(p.id) === value
                    ? "text-[#1a1a1a] font-medium bg-[#c6e135]/20"
                    : "text-gray-600"
                }`}
              >
                {p.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function IssuesPage() {
  const { t } = useI18n();
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
      issue.projectId !== filterProjectId
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
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("issues.title")}</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
        >
          <LuPlus className="w-4 h-4" />
          {t("issues.newIssue")}
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
            placeholder={t("issues.search")}
            className="bg-transparent outline-none text-sm text-[#1a1a1a] placeholder:text-gray-400 w-full"
          />
        </div>

        {/* Project filter — searchable dropdown */}
        <ProjectCombobox
          projects={projects}
          value={filterProjectId}
          onChange={setFilterProjectId}
          placeholder={t("issues.allProjects")}
        />

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
              {p === "all" ? t("issues.allPriorities") : t(`priority.${p}`)}
            </button>
          ))}
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...TYPE_LABELS].map((tp) => (
            <button
              key={tp}
              onClick={() => setFilterType(tp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === tp
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {tp === "all" ? t("issues.allTypes") : t(`type.${tp}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-500">
        {loading
          ? t("common.loading")
          : `${filteredIssues.length} ${filteredIssues.length !== 1 ? t("issues.issuesPlural") : t("issues.issueSingular")}`}
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
