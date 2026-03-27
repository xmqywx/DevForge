"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LuExternalLink,
  LuRefreshCw,
  LuSave,
  LuX,
  LuFileText,
  LuMessageSquare,
  LuTag,
  LuTriangleAlert,
} from "react-icons/lu";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  stage: "idea" | "dev" | "beta" | "live" | "paused" | "archived" | null;
  progressPct: number | null;
  progressPhase: string | null;
  priority: "high" | "medium" | "low" | null;
  tags: string[] | null;
  repoPath: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  isPublic: boolean | null;
  readme: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  issues?: Array<{ id: string; status: string }>;
  notes?: Array<{ id: string }>;
  releases?: Array<{ id: string }>;
}

interface ProjectEditFormProps {
  project: ProjectData;
}

// ─── Tiptap Toolbar ──────────────────────────────────────────────────────────

function TiptapToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `px-2 py-1 text-xs rounded border transition-colors ${
      active
        ? "bg-[#c6e135] border-[#a8c420] text-[#1a1a1a]"
        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-[#f9f9f5] rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btnClass(editor.isActive("code"))}
      >
        {"<>"}
      </button>
      <span className="border-l border-gray-200 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive("heading", { level: 1 }))}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive("heading", { level: 2 }))}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive("heading", { level: 3 }))}
      >
        H3
      </button>
      <span className="border-l border-gray-200 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive("blockquote"))}
      >
        Quote
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive("codeBlock"))}
      >
        Code Block
      </button>
      <span className="border-l border-gray-200 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        Redo
      </button>
    </div>
  );
}

// ─── Tiptap Editor ────────────────────────────────────────────────────────────

function TiptapEditor({
  value,
  onChange,
  placeholder,
  minHeight = "150px",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-3",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  return (
    <div className="border border-input rounded-lg overflow-hidden focus-within:ring-3 focus-within:ring-ring/50 focus-within:border-ring transition-colors">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput("");
    },
    [tags, onChange]
  );

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-lg bg-transparent focus-within:ring-3 focus-within:ring-ring/50 focus-within:border-ring min-h-[40px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-[#f0f0e8] border border-gray-300/60 rounded-full px-2.5 py-0.5 text-xs font-medium text-[#1a1a1a]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-red-500 transition-colors"
          >
            <LuX className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? "Type a tag and press Enter…" : "Add tag…"}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-[#1a1a1a]">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const { t } = useI18n();
  const router = useRouter();

  // Form state
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description ?? "");
  const [icon, setIcon] = useState(project.icon ?? "📦");
  const [stage, setStage] = useState(project.stage ?? "idea");
  const [priority, setPriority] = useState(project.priority ?? "medium");
  const [progressPct, setProgressPct] = useState(String(project.progressPct ?? 0));
  const [progressPhase, setProgressPhase] = useState(project.progressPhase ?? "");
  const [tags, setTags] = useState<string[]>(project.tags ?? []);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(project.websiteUrl ?? "");
  const [isPublic, setIsPublic] = useState(project.isPublic ?? false);
  const [readme, setReadme] = useState(project.readme ?? "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingReadme, setSyncingReadme] = useState(false);
  const [syncReadmeError, setSyncReadmeError] = useState<string | null>(null);

  // Sidebar counts
  const issueCount = project.issues?.length ?? 0;
  const noteCount = project.notes?.length ?? 0;
  const releaseCount = project.releases?.length ?? 0;

  const openIssueCount =
    project.issues?.filter(
      (i) => i.status === "open" || i.status === "in-progress" || i.status === "in-review"
    ).length ?? 0;

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const body = {
        name,
        slug,
        description,
        icon,
        stage,
        priority,
        progressPct: parseInt(progressPct, 10) || 0,
        progressPhase,
        tags,
        githubUrl: githubUrl || null,
        websiteUrl: websiteUrl || null,
        isPublic,
        readme,
      };

      const res = await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // If slug changed, navigate to new URL
      if (slug !== project.slug) {
        router.push(`/projects/${slug}`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  // Sync README from file
  const handleSyncReadme = async () => {
    setSyncingReadme(true);
    setSyncReadmeError(null);

    try {
      const res = await fetch(`/api/projects/${project.slug}/readme`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to read README");
      }
      const { content } = await res.json();
      setReadme(content);
    } catch (err) {
      setSyncReadmeError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSyncingReadme(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-[#1a1a1a] transition-colors">
          {t("projects.title")}
        </Link>
        <span>/</span>
        <span className="text-[#1a1a1a] font-medium">{project.name}</span>
        <span>/</span>
        <span className="text-gray-400">{t("common.edit")}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#c6e135] rounded-2xl flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">{project.name}</h1>
            <p className="text-sm text-gray-500">/{project.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.isPublic && (
            <a
              href={`https://forge.wdao.chat/projects/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-[#1a1a1a] transition-colors"
            >
              <LuExternalLink className="w-3.5 h-3.5" />
              {t("projects.previewPortal")}
            </a>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#c6e135] text-[#1a1a1a] rounded-lg hover:bg-[#b8d42a] disabled:opacity-60 transition-colors"
          >
            <LuSave className="w-3.5 h-3.5" />
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Save feedback */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-xl">
          Saved successfully.
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
          <LuTriangleAlert className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Left: Main Form (3 cols) ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-[#1a1a1a]">{t("projects.editProject")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("projects.name")} htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                />
              </Field>

              <Field
                label={t("projects.slug")}
                htmlFor="slug"
                hint="Used in URLs. Changing it will redirect you."
              >
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-project"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Icon" htmlFor="icon" hint="Emoji or short text">
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📦"
                />
              </Field>

              <Field label={t("projects.stage")} htmlFor="stage">
                <Select value={stage} onValueChange={(v) => setStage(v as typeof stage)}>
                  <SelectTrigger id="stage" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["idea", "dev", "beta", "live", "paused", "archived"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("projects.priority")} htmlFor="priority">
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as typeof priority)}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("projects.public")}>
                <div className="flex items-center gap-3 h-8 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      role="checkbox"
                      aria-checked={isPublic}
                      tabIndex={0}
                      onClick={() => setIsPublic(!isPublic)}
                      onKeyDown={(e) => e.key === " " && setIsPublic(!isPublic)}
                      className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
                        isPublic ? "bg-[#c6e135]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                          isPublic ? "translate-x-4.5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-[#1a1a1a]">
                      {isPublic ? "Public on Portal" : "Private"}
                    </span>
                  </label>
                </div>
              </Field>
            </div>

            <Field label={t("projects.description")}>
              <TiptapEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your project…"
              />
            </Field>

            <Field label={t("projects.tags")} hint="Press Enter or comma to add a tag">
              <TagInput tags={tags} onChange={setTags} />
            </Field>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-[#1a1a1a]">{t("projects.progress")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("projects.progress") + " %"}
                htmlFor="progressPct"
                hint="0–100"
              >
                <div className="space-y-2">
                  <Input
                    id="progressPct"
                    type="number"
                    min={0}
                    max={100}
                    value={progressPct}
                    onChange={(e) => setProgressPct(e.target.value)}
                  />
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c6e135] rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, parseInt(progressPct) || 0))}%` }}
                    />
                  </div>
                </div>
              </Field>

              <Field label={t("projects.progress") + " Phase"} htmlFor="progressPhase" hint="e.g. Phase 2 / 5">
                <Input
                  id="progressPhase"
                  value={progressPhase}
                  onChange={(e) => setProgressPhase(e.target.value)}
                  placeholder="Phase 1 / 3"
                />
              </Field>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-[#1a1a1a]">Links</h2>

            <Field label={t("projects.githubUrl")} htmlFor="githubUrl">
              <Input
                id="githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                type="url"
              />
            </Field>

            <Field label={t("projects.websiteUrl")} htmlFor="websiteUrl">
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </Field>
          </div>

          {/* README */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#1a1a1a]">{t("projects.readme")}</h2>
              <button
                type="button"
                onClick={handleSyncReadme}
                disabled={syncingReadme || !project.repoPath}
                title={
                  !project.repoPath
                    ? "No repoPath set for this project"
                    : "Read README.md from disk"
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-[#1a1a1a] disabled:opacity-50 transition-colors"
              >
                <LuRefreshCw
                  className={`w-3.5 h-3.5 ${syncingReadme ? "animate-spin" : ""}`}
                />
                {syncingReadme ? t("common.saving") : t("projects.syncReadme")}
              </button>
            </div>

            {syncReadmeError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <LuTriangleAlert className="w-3.5 h-3.5 shrink-0" />
                {syncReadmeError}
              </div>
            )}

            <TiptapEditor
              value={readme}
              onChange={setReadme}
              placeholder="Project README content…"
              minHeight="300px"
            />
          </div>
        </div>

        {/* ── Right: Sidebar (1 col) ── */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[#1a1a1a]">Related</h3>

            <Link
              href={`/projects/${project.slug}/issues`}
              className="flex items-center justify-between p-3 rounded-xl bg-[#f0f0e8] hover:bg-[#e8e8e0] transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                <LuTriangleAlert className="w-4 h-4 text-orange-500" />
                {t("projects.issues")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#1a1a1a]">{issueCount}</span>
                {openIssueCount > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5 font-medium">
                    {openIssueCount} open
                  </span>
                )}
              </div>
            </Link>

            <Link
              href={`/projects/${project.slug}/notes`}
              className="flex items-center justify-between p-3 rounded-xl bg-[#f0f0e8] hover:bg-[#e8e8e0] transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                <LuMessageSquare className="w-4 h-4 text-blue-500" />
                {t("projects.notes")}
              </div>
              <span className="font-bold text-[#1a1a1a]">{noteCount}</span>
            </Link>

            <Link
              href={`/projects/${project.slug}/releases`}
              className="flex items-center justify-between p-3 rounded-xl bg-[#f0f0e8] hover:bg-[#e8e8e0] transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                <LuTag className="w-4 h-4 text-purple-500" />
                {t("projects.releases")}
              </div>
              <span className="font-bold text-[#1a1a1a]">{releaseCount}</span>
            </Link>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[#1a1a1a]">Metadata</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-[#1a1a1a]">{project.id}</span>
              </div>
              {project.repoPath && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-500">Repo Path</span>
                  <span className="font-mono text-[#1a1a1a] break-all text-[10px]">
                    {project.repoPath}
                  </span>
                </div>
              )}
              {project.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-[#1a1a1a]">{project.createdAt.split("T")[0]}</span>
                </div>
              )}
              {project.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="text-[#1a1a1a]">{project.updatedAt.split("T")[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Portal link */}
          {isPublic && (
            <div className="bg-[#c6e135]/20 border border-[#c6e135] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#1a1a1a]">
                <LuFileText className="w-4 h-4" />
                Portal Page
              </div>
              <a
                href={`https://forge.wdao.chat/projects/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#1a1a1a] hover:underline break-all"
              >
                <LuExternalLink className="w-3 h-3 shrink-0" />
                forge.wdao.chat/projects/{project.slug}
              </a>
            </div>
          )}

          {/* Save button (sticky bottom of sidebar) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#c6e135] text-[#1a1a1a] rounded-xl hover:bg-[#b8d42a] disabled:opacity-60 transition-colors"
          >
            <LuSave className="w-4 h-4" />
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
