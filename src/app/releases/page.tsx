"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LuPlus,
  LuSearch,
  LuTag,
  LuExternalLink,
  LuPencil,
  LuTrash2,
  LuCalendar,
} from "react-icons/lu";
import { ReleaseForm } from "@/components/release-form";
import { useI18n } from "@/lib/i18n";

interface Project {
  id: number;
  name: string;
  repoPath: string | null;
}

interface Release {
  id: number;
  projectId: number;
  version: string;
  title: string;
  content: string;
  downloadUrl: string | null;
  publishedAt: string | null;
  createdAt: string | null;
}

interface ReleaseWithProject extends Release {
  projectName: string;
}

type GroupMode = "project" | "timeline";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function VersionPill({ version }: { version: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c6e135] text-[#1a1a1a] text-xs font-semibold">
      <LuTag className="w-3 h-3" />
      {version}
    </span>
  );
}

function ReleaseCard({
  release,
  onEdit,
  onDelete,
}: {
  release: ReleaseWithProject;
  onEdit: (r: Release) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete release ${release.version} "${release.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      onDelete(release.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-3">
        {/* Left: version + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <VersionPill version={release.version} />
            <span className="text-xs text-gray-400 font-medium">
              {release.projectName}
            </span>
          </div>
          <h3 className="font-semibold text-[#1a1a1a] text-base leading-snug">
            {release.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
            <LuCalendar className="w-3.5 h-3.5" />
            <span>{formatDate(release.publishedAt ?? release.createdAt)}</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {release.downloadUrl && (
            <a
              href={release.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-colors"
              title={t("common.edit")}
            >
              <LuExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(release)}
            className="p-2 rounded-lg text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-colors"
            title={t("common.edit")}
          >
            <LuPencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title={t("common.delete")}
          >
            <LuTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable changelog */}
      {release.content && (
        <>
          <div
            className={`px-5 overflow-hidden transition-all duration-200 ${
              expanded ? "pb-4" : "max-h-0"
            }`}
          >
            <div
              className="prose prose-sm max-w-none text-gray-600 border-t pt-3"
              dangerouslySetInnerHTML={{ __html: release.content }}
            />
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full px-5 py-2 text-xs text-gray-400 hover:text-gray-600 border-t transition-colors text-center"
          >
            {expanded ? `Hide ${t("releases.changelog")}` : `Show ${t("releases.changelog")}`}
          </button>
        </>
      )}
    </div>
  );
}

export default function ReleasesPage() {
  const { t } = useI18n();
  const [releases, setReleases] = useState<ReleaseWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("timeline");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [releasesRes, projectsRes] = await Promise.all([
          fetch("/api/releases"),
          fetch("/api/projects"),
        ]);
        const releasesData: Release[] = await releasesRes.json();
        const projectsData: Project[] = await projectsRes.json();

        const projectMap = new Map(projectsData.map((p) => [p.id, p]));
        const enriched: ReleaseWithProject[] = releasesData.map((r) => ({
          ...r,
          projectName: projectMap.get(r.projectId)?.name ?? `Project #${r.projectId}`,
        }));

        setReleases(enriched);
        setProjects(projectsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaved = useCallback(
    (saved: Release) => {
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      const enriched: ReleaseWithProject = {
        ...saved,
        projectName: projectMap.get(saved.projectId)?.name ?? `Project #${saved.projectId}`,
      };

      setReleases((prev) => {
        const exists = prev.find((r) => r.id === saved.id);
        if (exists) {
          return prev
            .map((r) => (r.id === saved.id ? enriched : r))
            .sort(
              (a, b) =>
                new Date(b.publishedAt ?? b.createdAt ?? "").getTime() -
                new Date(a.publishedAt ?? a.createdAt ?? "").getTime()
            );
        }
        return [enriched, ...prev];
      });

      setFormOpen(false);
      setEditingRelease(null);
    },
    [projects]
  );

  const handleDeleted = useCallback((id: number) => {
    setReleases((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleEdit = useCallback((release: Release) => {
    setEditingRelease(release);
    setFormOpen(true);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingRelease(null);
    setFormOpen(true);
  }, []);

  // Filter
  const filtered = releases.filter((r) => {
    if (filterProjectId !== "all" && String(r.projectId) !== filterProjectId)
      return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.version.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Group by project
  const byProject = filtered.reduce<Map<string, ReleaseWithProject[]>>(
    (acc, r) => {
      const key = r.projectName;
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key)!.push(r);
      return acc;
    },
    new Map()
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("releases.title")}</h1>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
        >
          <LuPlus className="w-4 h-4" />
          {t("releases.newRelease")}
        </button>
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
            placeholder={t("releases.search")}
            className="bg-transparent outline-none text-sm text-[#1a1a1a] placeholder:text-gray-400 w-full"
          />
        </div>

        {/* Project filter */}
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="bg-white rounded-full px-4 py-2 shadow-sm text-sm text-[#1a1a1a] outline-none cursor-pointer"
        >
          <option value="all">{t("releases.allProjects")}</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Group mode */}
        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
          {(["timeline", "project"] as GroupMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setGroupMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                groupMode === mode
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mode === "timeline" ? t("releases.timeline") : t("releases.byProject")}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-500">
        {loading
          ? t("common.loading")
          : `${filtered.length} release${filtered.length !== 1 ? "s" : ""}`}
      </div>

      {/* Release list */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-8 py-16 text-center">
          <p className="text-gray-400 text-sm">{t("releases.noReleases")}</p>
          <button
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-4 py-2 text-sm font-medium hover:brightness-95 transition-all"
          >
            <LuPlus className="w-4 h-4" />
            {t("releases.newRelease")}
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {groupMode === "timeline" ? (
            // Flat timeline
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <ReleaseCard
                  key={r.id}
                  release={r}
                  onEdit={handleEdit}
                  onDelete={handleDeleted}
                />
              ))}
            </div>
          ) : (
            // Grouped by project
            <div className="flex flex-col gap-8">
              {Array.from(byProject.entries()).map(([projectName, items]) => (
                <div key={projectName}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {projectName}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {items.map((r) => (
                      <ReleaseCard
                        key={r.id}
                        release={r}
                        onEdit={handleEdit}
                        onDelete={handleDeleted}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit form dialog */}
      {formOpen && (
        <ReleaseForm
          projects={projects}
          release={editingRelease}
          onClose={() => {
            setFormOpen(false);
            setEditingRelease(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
