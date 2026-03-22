"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LuFilter,
  LuCircleArrowUp,
  LuMessageSquare,
  LuBug,
  LuLightbulb,
  LuCircleHelp,
  LuShield,
  LuCircleArrowRight,
  LuLoaderCircle,
} from "react-icons/lu";

interface FeedbackItem {
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
  createdAt: string | null;
  updatedAt: string | null;
}

const STATUS_OPTIONS = [
  "open",
  "under-review",
  "in-progress",
  "resolved",
  "wont-fix",
  "spam",
] as const;

const FILTER_OPTIONS = ["all", ...STATUS_OPTIONS] as const;

const statusPill: Record<string, string> = {
  open: "border border-gray-300 text-[#1a1a1a]",
  "under-review": "bg-blue-100 text-blue-700",
  "in-progress": "bg-[#c6e135] text-[#1a1a1a]",
  resolved: "bg-emerald-100 text-emerald-700",
  "wont-fix": "bg-gray-200 text-gray-500",
  spam: "bg-red-100 text-red-500",
};

const typeConfig: Record<string, { icon: typeof LuBug; label: string; cls: string }> = {
  bug: { icon: LuBug, label: "Bug", cls: "bg-red-100 text-red-600" },
  feature: { icon: LuLightbulb, label: "Feature", cls: "bg-amber-100 text-amber-700" },
  improvement: { icon: LuCircleArrowUp, label: "Improvement", cls: "bg-blue-100 text-blue-600" },
  question: { icon: LuCircleHelp, label: "Question", cls: "bg-purple-100 text-purple-600" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<Record<number, boolean>>({});

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback?includeSpam=true");
      const data = await res.json();
      setItems(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: number, status: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
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
        setItems((prev) =>
          prev.map((item) =>
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

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Feedback</h1>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <LuFilter className="w-4 h-4 text-gray-400" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === opt
                ? "bg-[#c6e135] text-[#1a1a1a]"
                : "bg-white text-gray-500 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {opt === "all" ? "All" : opt.replace("-", " ")}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <LuLoaderCircle className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">
          No feedback {filter !== "all" ? `with status "${filter.replace("-", " ")}"` : "yet"}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const tc = typeConfig[item.type ?? "feature"] ?? typeConfig.feature;
            const TypeIcon = tc.icon;
            const isBusy = busy[item.id] ?? false;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-600">
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
                    </div>
                    <h3 className="font-semibold text-[#1a1a1a] text-base">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Upvotes */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <LuCircleArrowUp className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      {item.upvotes ?? 0}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
                  {/* Status dropdown */}
                  <select
                    value={item.status ?? "open"}
                    disabled={isBusy}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize outline-none cursor-pointer disabled:opacity-50 ${
                      statusPill[item.status ?? "open"] ?? statusPill.open
                    }`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("-", " ")}
                      </option>
                    ))}
                  </select>

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
                      Convert to Issue
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
                      Mark Spam
                    </button>
                  )}

                  <span className="text-xs text-gray-300 ml-auto">#{item.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
