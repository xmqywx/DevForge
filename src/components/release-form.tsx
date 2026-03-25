"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { LuX, LuWand, LuLoader } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ReleaseFormProps {
  projects: Project[];
  release?: Release | null;
  onClose: () => void;
  onSaved: (release: Release) => void;
}

export function ReleaseForm({
  projects,
  release,
  onClose,
  onSaved,
}: ReleaseFormProps) {
  const { t } = useI18n();
  const isEditing = !!release;

  const [projectId, setProjectId] = useState<string>(
    release ? String(release.projectId) : projects[0] ? String(projects[0].id) : ""
  );
  const [version, setVersion] = useState(release?.version ?? "");
  const [title, setTitle] = useState(release?.title ?? "");
  const [downloadUrl, setDownloadUrl] = useState(release?.downloadUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [generating, setGenerating] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write changelog here…" }),
    ],
    content: release?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none text-[#1a1a1a]",
      },
    },
  });

  // When editing, set initial content once editor is ready
  useEffect(() => {
    if (editor && release?.content && editor.isEmpty) {
      editor.commands.setContent(release.content);
    }
  }, [editor, release?.content]);

  const selectedProject = projects.find((p) => String(p.id) === projectId);

  const handleGenerateChangelog = useCallback(async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/releases/generate-changelog?projectId=${projectId}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error ?? "Failed to generate changelog");
        setTimeout(() => setSaveMsg(""), 3000);
        return;
      }
      if (editor) {
        editor.commands.setContent(data.changelog);
      }
    } catch {
      setSaveMsg("Failed to generate changelog");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setGenerating(false);
    }
  }, [projectId, editor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !version.trim() || !title.trim()) {
      setSaveMsg("Project, version and title are required.");
      setTimeout(() => setSaveMsg(""), 3000);
      return;
    }

    const content = editor?.getHTML() ?? "";
    const payload = {
      projectId: Number(projectId),
      version: version.trim(),
      title: title.trim(),
      content,
      downloadUrl: downloadUrl.trim() || null,
    };

    setSaving(true);
    setSaveMsg("");
    try {
      const res = isEditing
        ? await fetch(`/api/releases/${release.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/releases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error(await res.text());
      const saved: Release = await res.json();
      onSaved(saved);
    } catch {
      setSaveMsg("Failed to save release.");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">
            {isEditing ? t("common.edit") + " " + t("releases.title").replace(/s$/, "") : t("releases.newRelease")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Project + Version row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t("milestones.project")}</Label>
                <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t("releases.version")}</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v1.2.0"
                />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Release title"
              />
            </div>

            {/* Changelog editor */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>{t("releases.changelog")}</Label>
                <button
                  type="button"
                  onClick={handleGenerateChangelog}
                  disabled={generating || !selectedProject?.repoPath}
                  title={
                    !selectedProject?.repoPath
                      ? "Project has no repo path configured"
                      : "Generate from recent git commits"
                  }
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {generating ? (
                    <LuLoader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LuWand className="w-3.5 h-3.5" />
                  )}
                  {t("releases.generateFromGit")}
                </button>
              </div>

              {/* Tiptap toolbar */}
              <div className="border rounded-xl overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50 text-xs text-gray-600 flex-wrap">
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded font-bold transition-colors ${
                      editor?.isActive("bold")
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded italic transition-colors ${
                      editor?.isActive("italic")
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={`px-2 py-1 rounded transition-colors ${
                      editor?.isActive("heading", { level: 2 })
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                    className={`px-2 py-1 rounded transition-colors ${
                      editor?.isActive("bulletList")
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleOrderedList().run()
                    }
                    className={`px-2 py-1 rounded transition-colors ${
                      editor?.isActive("orderedList")
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    1. List
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editor?.chain().focus().toggleCode().run()
                    }
                    className={`px-2 py-1 rounded font-mono transition-colors ${
                      editor?.isActive("code")
                        ? "bg-[#c6e135] text-[#1a1a1a]"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {"</>"}
                  </button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Download URL */}
            <div className="flex flex-col gap-1.5">
              <Label>
                {t("releases.downloadUrl")}{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
            {saveMsg ? (
              <span
                className={`text-sm ${
                  saveMsg.includes("Failed") || saveMsg.includes("required")
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {saveMsg}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#c6e135] text-[#1a1a1a] hover:brightness-95"
              >
                {saving ? t("common.loading") : isEditing ? t("common.save") : t("common.create")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
