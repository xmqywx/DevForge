"use client";

import { useState } from "react";
import {
  LuCircleArrowUp,
  LuMessageSquare,
  LuBug,
  LuLightbulb,
  LuCircleHelp,
  LuShield,
  LuCircleArrowRight,
  LuLoaderCircle,
  LuReply,
} from "react-icons/lu";
import { FeedbackReplyDrawer } from "./feedback-reply-drawer";
import { useI18n } from "@/lib/i18n";

const SERVER_URL =
  process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";

export interface FeedbackItem {
  id: number;
  projectId: number;
  authorName: string | null;
  title: string;
  description: string | null;
  type: string | null;
  status: string | null;
  upvotes: number | null;
  isConverted: boolean | null;
  issueId: number | null;
  images?: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const STATUS_OPTIONS = [
  "open",
  "under-review",
  "in-progress",
  "resolved",
  "wont-fix",
  "spam",
] as const;

const statusPill: Record<string, string> = {
  open: "border border-gray-300 text-[#1a1a1a]",
  "under-review": "bg-blue-100 text-blue-700",
  "in-progress": "bg-[#c6e135] text-[#1a1a1a]",
  resolved: "bg-emerald-100 text-emerald-700",
  "wont-fix": "bg-gray-200 text-gray-500",
  spam: "bg-red-100 text-red-500",
};

const typeConfig: Record<
  string,
  { icon: typeof LuBug; label: string; cls: string }
> = {
  bug: { icon: LuBug, label: "Bug", cls: "bg-red-100 text-red-600" },
  feature: {
    icon: LuLightbulb,
    label: "Feature",
    cls: "bg-amber-100 text-amber-700",
  },
  improvement: {
    icon: LuCircleArrowUp,
    label: "Improvement",
    cls: "bg-blue-100 text-blue-600",
  },
  question: {
    icon: LuCircleHelp,
    label: "Question",
    cls: "bg-purple-100 text-purple-600",
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function avatarUrl(name: string | null) {
  const seed = encodeURIComponent(name ?? "A");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

/** Prefix server-relative image paths with the server domain */
function resolveImageUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SERVER_URL}${path}`;
}

interface Props {
  items: FeedbackItem[];
  onItemsChange: (updated: FeedbackItem[]) => void;
}

export function FeedbackAdminList({ items, onItemsChange }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [replyTarget, setReplyTarget] = useState<FeedbackItem | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onItemsChange(
        items.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch {
      /* ignore */
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const convertToIssue = async (id: number) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      const res = await fetch("/api/feedback/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        onItemsChange(
          items.map((item) =>
            item.id === id
              ? { ...item, isConverted: true, issueId: data.issue.id }
              : item
          )
        );
      }
    } catch {
      /* ignore */
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const tc = typeConfig[item.type ?? "feature"] ?? typeConfig.feature;
          const TypeIcon = tc.icon;
          const isBusy = busy[item.id] ?? false;
          const images = (item.images ?? []).filter(Boolean);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm p-5 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Avatar */}
                  <img
                    src={avatarUrl(item.authorName)}
                    alt={item.authorName ?? "Anonymous"}
                    className="w-9 h-9 rounded-full shrink-0 bg-gray-100"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.authorName ?? "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-300">
                        {formatDate(item.createdAt)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tc.cls}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {tc.label}
                      </span>
                      {item.status && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            statusPill[item.status] ?? statusPill.open
                          }`}
                        >
                          {item.status.replace(/-/g, " ")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#1a1a1a] text-base">
                      {item.title}
                    </h3>
                    {item.description && (
                      <div
                        className="text-sm text-gray-500 mt-1 line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    )}
                  </div>
                </div>

                {/* Upvotes */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <LuCircleArrowUp className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {item.upvotes ?? 0}
                  </span>
                  <span className="text-[10px] text-gray-400">{t("feedback.votes")}</span>
                </div>
              </div>

              {/* Images */}
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((src, i) => (
                    <a
                      key={i}
                      href={resolveImageUrl(src)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={resolveImageUrl(src)}
                        alt={`attachment ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                {/* Status dropdown */}
                <select
                  value={item.status ?? "open"}
                  disabled={isBusy}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize outline-none cursor-pointer disabled:opacity-50 ${
                    statusPill[item.status ?? "open"] ?? statusPill.open
                  }`}
                  title={t("feedback.changeStatus")}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>

                {/* Reply */}
                <button
                  disabled={isBusy}
                  onClick={() => setReplyTarget(item)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#c6e135] text-[#1a1a1a] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <LuReply className="w-3.5 h-3.5" />
                  {t("feedback.reply")}
                </button>

                {/* Convert to Issue */}
                {item.isConverted ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <LuCircleArrowRight className="w-3.5 h-3.5" />
                    Issue #{item.issueId}
                  </span>
                ) : (
                  <button
                    disabled={isBusy}
                    onClick={() => convertToIssue(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <LuMessageSquare className="w-3.5 h-3.5" />
                    {t("feedback.convertToIssue")}
                  </button>
                )}

                {/* Mark Spam */}
                {item.status !== "spam" && (
                  <button
                    disabled={isBusy}
                    onClick={() => updateStatus(item.id, "spam")}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LuShield className="w-3.5 h-3.5" />
                    {t("feedback.markSpam")}
                  </button>
                )}

                {isBusy && (
                  <LuLoaderCircle className="w-3.5 h-3.5 animate-spin text-gray-400 ml-1" />
                )}

                <span className="text-xs text-gray-300 ml-auto">
                  #{item.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply drawer */}
      {replyTarget && (
        <FeedbackReplyDrawer
          feedback={replyTarget}
          onClose={() => setReplyTarget(null)}
        />
      )}
    </>
  );
}
