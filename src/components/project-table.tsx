"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  ArrowUpDownIcon,
  ExternalLinkIcon,
  CheckSquareIcon,
  SquareIcon,
} from "lucide-react";

const STAGES = ["idea", "dev", "beta", "live", "paused", "archived"] as const;
type Stage = (typeof STAGES)[number];

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  stage: Stage | null;
  progressPct: number | null;
  progressPhase: string | null;
  isPublic: boolean | null;
  updatedAt: string | null;
  openIssueCount: number;
}

type SortKey = "name" | "stage" | "progressPct" | "openIssueCount" | "updatedAt";
type SortDir = "asc" | "desc";

async function patchProject(slug: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/projects/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

async function createProject(data: {
  name: string;
  slug: string;
  description?: string;
  stage?: Stage;
}) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---- New Project Dialog ----
interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: ProjectRow) => void;
}

function NewProjectDialog({ open, onClose, onCreated }: NewProjectDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Stage>("idea");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slug = slugify(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await createProject({ name: name.trim(), slug, description, stage });
      onCreated({ ...created, openIssueCount: 0 });
      setName("");
      setDescription("");
      setStage("idea");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("projects.errorCreate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("projects.newProject")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1a1a1a]">{t("projects.fieldName")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome project"
              required
            />
            {slug && (
              <p className="text-xs text-gray-400">slug: {slug}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1a1a1a]">{t("projects.fieldDescription")}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1a1a1a]">{t("projects.fieldStage")}</label>
            <Select value={stage} onValueChange={(v) => { if (v) setStage(v as Stage); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`stage.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || saving}
              className="bg-[#c6e135] text-[#1a1a1a] hover:bg-[#b5d12e] border-transparent"
            >
              {saving ? t("projects.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Inline stage select ----
function InlineStageSelect({
  slug,
  value,
  onChange,
}: {
  slug: string;
  value: Stage;
  onChange: (slug: string, stage: Stage) => void;
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value as Stage;
    if (!newStage) return;
    setSaving(true);
    try {
      await patchProject(slug, { stage: newStage });
      onChange(slug, newStage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="h-7 px-2 rounded-lg border border-transparent bg-transparent hover:bg-gray-100 text-xs outline-none focus:border-gray-300 disabled:opacity-50 cursor-pointer"
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {t(`stage.${s}`)}
        </option>
      ))}
    </select>
  );
}

// ---- Inline progress slider ----
function InlineProgressSlider({
  slug,
  value,
  onChange,
}: {
  slug: string;
  value: number;
  onChange: (slug: string, pct: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleCommit(pct: number) {
    setSaving(true);
    try {
      await patchProject(slug, { progress_pct: pct });
      onChange(slug, pct);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onMouseUp={() => handleCommit(local)}
        onTouchEnd={() => handleCommit(local)}
        disabled={saving}
        className="w-20 h-1.5 accent-[#c6e135] cursor-pointer disabled:opacity-50"
      />
      <span className="text-xs text-gray-500 w-8">{local}%</span>
    </div>
  );
}

// ---- Inline public toggle ----
function InlinePublicToggle({
  slug,
  value,
  onChange,
}: {
  slug: string;
  value: boolean;
  onChange: (slug: string, isPublic: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !value;
    setSaving(true);
    try {
      await patchProject(slug, { is_public: next });
      onChange(slug, next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#c6e135] focus-visible:outline-none disabled:opacity-50 ${
        value ? "bg-[#c6e135]" : "bg-gray-200"
      }`}
      aria-label={value ? "Public" : "Private"}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ---- Sort header button ----
function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-[#1a1a1a] transition-colors"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUpIcon className="size-3" />
        ) : (
          <ChevronDownIcon className="size-3" />
        )
      ) : (
        <ArrowUpDownIcon className="size-3 opacity-40" />
      )}
    </button>
  );
}

// ---- Batch actions bar ----
interface BatchActionsBarProps {
  count: number;
  onChangeStage: (stage: Stage) => void;
  onSetPublic: (isPublic: boolean) => void;
  onArchive: () => void;
  onClear: () => void;
}

function BatchActionsBar({
  count,
  onChangeStage,
  onSetPublic,
  onArchive,
  onClear,
}: BatchActionsBarProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#c6e135]/20 border border-[#c6e135] rounded-xl">
      <span className="text-sm font-medium text-[#1a1a1a]">
        {count} {t("projects.selected")}
      </span>
      <div className="h-4 w-px bg-gray-300" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{t("projects.fieldStage")}:</span>
        <select
          onChange={(e) => { if (e.target.value) onChangeStage(e.target.value as Stage); }}
          className="h-7 px-2 rounded-lg border border-gray-300 text-xs bg-white outline-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>{t("projects.change")}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{t(`stage.${s}`)}</option>
          ))}
        </select>
      </div>
      <Button
        size="xs"
        variant="outline"
        onClick={() => onSetPublic(true)}
        className="text-xs"
      >
        {t("projects.setPublic")}
      </Button>
      <Button
        size="xs"
        variant="outline"
        onClick={() => onSetPublic(false)}
        className="text-xs"
      >
        {t("projects.setPrivate")}
      </Button>
      <Button
        size="xs"
        variant="destructive"
        onClick={onArchive}
        className="text-xs"
      >
        {t("projects.archive")}
      </Button>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs text-gray-500 hover:text-[#1a1a1a]"
      >
        {t("projects.clearSelection")}
      </button>
    </div>
  );
}

// ---- Main table component ----
interface ProjectTableProps {
  initialProjects: ProjectRow[];
}

export function ProjectTable({ initialProjects }: ProjectTableProps) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Listen for floating-action events
  useEffect(() => {
    const handleCreate = () => setShowNewDialog(true);
    window.addEventListener("devforge:create-project", handleCreate);
    return () => window.removeEventListener("devforge:create-project", handleCreate);
  }, []);

  // Filter + sort
  const visible = useMemo(() => {
    let list = projects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      list = list.filter((p) => p.stage === stageFilter);
    }
    list = [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortKey === "stage") {
        av = a.stage ?? "";
        bv = b.stage ?? "";
      } else if (sortKey === "progressPct") {
        av = a.progressPct ?? 0;
        bv = b.progressPct ?? 0;
      } else if (sortKey === "openIssueCount") {
        av = a.openIssueCount;
        bv = b.openIssueCount;
      } else {
        av = a.updatedAt ?? "";
        bv = b.updatedAt ?? "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [projects, search, stageFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Inline edit callbacks
  const handleStageChange = useCallback((slug: string, stage: Stage) => {
    setProjects((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, stage } : p))
    );
  }, []);

  const handleProgressChange = useCallback((slug: string, progressPct: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, progressPct } : p))
    );
  }, []);

  const handlePublicChange = useCallback((slug: string, isPublic: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, isPublic } : p))
    );
  }, []);

  // Selection
  const allVisibleIds = visible.map((p) => p.id);
  const allSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selected.has(id));
  const someSelected = allVisibleIds.some((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => {
        const next = new Set(s);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Batch actions
  const selectedProjects = projects.filter((p) => selected.has(p.id));

  async function batchChangeStage(stage: Stage) {
    await Promise.all(
      selectedProjects.map((p) => patchProject(p.slug, { stage }))
    );
    setProjects((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, stage } : p))
    );
    setSelected(new Set());
  }

  async function batchSetPublic(isPublic: boolean) {
    await Promise.all(
      selectedProjects.map((p) => patchProject(p.slug, { is_public: isPublic }))
    );
    setProjects((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, isPublic } : p))
    );
    setSelected(new Set());
  }

  async function batchArchive() {
    await Promise.all(
      selectedProjects.map((p) => patchProject(p.slug, { stage: "archived" }))
    );
    setProjects((prev) =>
      prev.map((p) =>
        selected.has(p.id) ? { ...p, stage: "archived" as Stage } : p
      )
    );
    setSelected(new Set());
  }

  function handleCreated(project: ProjectRow) {
    setProjects((prev) => [project, ...prev]);
    setShowNewDialog(false);
  }

  function formatDate(dt: string | null) {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("projects.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} {t("projects.total")}</p>
        </div>
        <Button
          onClick={() => setShowNewDialog(true)}
          className="bg-[#c6e135] text-[#1a1a1a] hover:bg-[#b5d12e] border-transparent rounded-full gap-1.5"
        >
          <PlusIcon className="size-4" />
          {t("projects.newProject")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder={t("projects.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStageFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              stageFilter === "all"
                ? "bg-[#1a1a1a] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {t("projects.allStages")}
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStageFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                stageFilter === s
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {t(`stage.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <BatchActionsBar
          count={selected.size}
          onChangeStage={batchChangeStage}
          onSetPublic={batchSetPublic}
          onArchive={batchArchive}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-10 px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-gray-400 hover:text-[#1a1a1a] transition-colors"
                    aria-label="Select all"
                  >
                    {allSelected ? (
                      <CheckSquareIcon className="size-4 text-[#1a1a1a]" />
                    ) : someSelected ? (
                      <CheckSquareIcon className="size-4 text-gray-400" />
                    ) : (
                      <SquareIcon className="size-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label={t("projects.colName")} sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label={t("projects.colStage")} sortKey="stage" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label={t("projects.colProgress")} sortKey="progressPct" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label={t("projects.colIssues")} sortKey="openIssueCount" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("projects.colPublic")}</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label={t("projects.colUpdated")} sortKey="updatedAt" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("projects.colActions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {t("projects.noProjects")}
                  </td>
                </tr>
              ) : (
                visible.map((project) => (
                  <tr
                    key={project.id}
                    className={`group transition-colors hover:bg-gray-50 ${
                      selected.has(project.id) ? "bg-[#c6e135]/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleOne(project.id)}
                        className="text-gray-400 hover:text-[#1a1a1a] transition-colors"
                        aria-label={`Select ${project.name}`}
                      >
                        {selected.has(project.id) ? (
                          <CheckSquareIcon className="size-4 text-[#1a1a1a]" />
                        ) : (
                          <SquareIcon className="size-4" />
                        )}
                      </button>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{project.icon ?? "📦"}</span>
                        <div>
                          <Link
                            href={`/projects/${project.slug}`}
                            className="font-medium text-[#1a1a1a] hover:text-[#c6e135] transition-colors"
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-xs">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <InlineStageSelect
                        slug={project.slug}
                        value={project.stage ?? "idea"}
                        onChange={handleStageChange}
                      />
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <InlineProgressSlider
                        slug={project.slug}
                        value={project.progressPct ?? 0}
                        onChange={handleProgressChange}
                      />
                    </td>

                    {/* Issues */}
                    <td className="px-4 py-3">
                      {project.openIssueCount > 0 ? (
                        <Link href={`/projects/${project.slug}#issues`}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                            {project.openIssueCount} open
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Public */}
                    <td className="px-4 py-3">
                      <InlinePublicToggle
                        slug={project.slug}
                        value={project.isPublic ?? false}
                        onChange={handlePublicChange}
                      />
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{formatDate(project.updatedAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/projects/${project.slug}`}>
                          <Button size="icon-sm" variant="ghost" title="View project">
                            <ExternalLinkIcon className="size-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {visible.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {t("projects.showing")} {visible.length} / {projects.length}
          </div>
        )}
      </div>

      {/* New project dialog */}
      <NewProjectDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
