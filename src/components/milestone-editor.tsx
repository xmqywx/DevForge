"use client";

import { useState, useEffect } from "react";
import { LuX, LuTrash2 } from "react-icons/lu";
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
import { useI18n } from "@/lib/i18n";

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: "completed" | "current" | "planned";
  date: string;
  icon: string | null;
  createdAt: string | null;
  projectName?: string | null;
}

interface Project {
  id: number;
  name: string;
}

interface MilestoneEditorProps {
  milestone: Milestone | null; // null = create new
  projects: Project[];
  defaultProjectId?: number;
  onClose: () => void;
  onSaved: (milestone: Milestone) => void;
  onDeleted?: (id: number) => void;
}

const ICON_OPTIONS = [
  { value: "milestone", label: "Milestone" },
  { value: "launch", label: "Launch" },
  { value: "pivot", label: "Pivot" },
  { value: "idea", label: "Idea" },
  { value: "integration", label: "Integration" },
];

const STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "current", label: "Current" },
  { value: "planned", label: "Planned" },
];

export function MilestoneEditor({
  milestone,
  projects,
  defaultProjectId,
  onClose,
  onSaved,
  onDeleted,
}: MilestoneEditorProps) {
  const { t } = useI18n();
  const isNew = !milestone;

  const [projectId, setProjectId] = useState<string>(
    milestone ? String(milestone.projectId) : defaultProjectId ? String(defaultProjectId) : ""
  );
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [date, setDate] = useState(milestone?.date ?? "");
  const [status, setStatus] = useState<string>(milestone?.status ?? "planned");
  const [icon, setIcon] = useState<string>(milestone?.icon ?? "milestone");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Sync form when milestone changes
  useEffect(() => {
    if (milestone) {
      setProjectId(String(milestone.projectId));
      setTitle(milestone.title);
      setDescription(milestone.description ?? "");
      setDate(milestone.date);
      setStatus(milestone.status);
      setIcon(milestone.icon ?? "milestone");
    } else {
      setProjectId(defaultProjectId ? String(defaultProjectId) : projects[0] ? String(projects[0].id) : "");
      setTitle("");
      setDescription("");
      setDate("");
      setStatus("planned");
      setIcon("milestone");
    }
    setError("");
  }, [milestone?.id]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (!projectId) {
      setError("Project is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        date,
        status,
        icon,
      };

      const res = await fetch(
        isNew ? "/api/milestones" : `/api/milestones/${milestone!.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      const saved: Milestone = await res.json();
      // Attach project name for display
      const proj = projects.find((p) => p.id === projectId);
      onSaved({ ...saved, projectName: proj?.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!milestone) return;
    if (!confirm(`Delete milestone "${milestone.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/milestones/${milestone.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      onDeleted?.(milestone.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto bg-black/10"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-semibold text-[#1a1a1a]">
            {isNew ? t("milestones.newMilestone") : t("milestones.editMilestone")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("milestones.project")}</Label>
            <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project..." />
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

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MVP Launch"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("milestones.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What does this milestone represent?"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("milestones.date")}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Status + Icon row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("milestones.status")}</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("milestones.icon")}</Label>
              <Select value={icon} onValueChange={(v) => v && setIcon(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
          {!isNew && onDeleted ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <LuTrash2 className="w-4 h-4" />
              {deleting ? t("common.loading") : t("common.delete")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || deleting}
              className="bg-[#c6e135] text-[#1a1a1a] hover:brightness-95"
            >
              {saving ? t("common.loading") : isNew ? t("common.create") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
