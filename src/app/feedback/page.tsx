"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LuFilter, LuLoaderCircle, LuRefreshCw } from "react-icons/lu";
import {
  FeedbackAdminList,
  STATUS_OPTIONS,
  type FeedbackItem,
} from "@/components/feedback-admin-list";
import { useI18n } from "@/lib/i18n";

const SERVER_URL =
  process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";

const FILTER_OPTIONS = ["all", ...STATUS_OPTIONS] as const;

const POLL_INTERVAL = 60_000; // 60 seconds

async function fetchFromServer(): Promise<FeedbackItem[]> {
  try {
    const res = await fetch(`${SERVER_URL}/api/feedback`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function FeedbackPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for floating-action events
  useEffect(() => {
    const handleToggleFilters = () => setShowFilters((v) => !v);
    window.addEventListener("devforge:toggle-filters", handleToggleFilters);
    return () => window.removeEventListener("devforge:toggle-filters", handleToggleFilters);
  }, []);

  const loadFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const serverItems = await fetchFromServer();
      if (serverItems.length > 0) {
        setItems(serverItems);
      } else {
        // Fall back to local DB if server returns nothing
        const localRes = await fetch("/api/feedback?includeSpam=true");
        if (localRes.ok) {
          const localData = await localRes.json();
          setItems(localData);
        }
      }
      setLastFetched(new Date());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFeedback(false);
  }, [loadFeedback]);

  // 60-second polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadFeedback(true);
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadFeedback]);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("feedback.title")}</h1>
          {lastFetched && (
            <p className="text-xs text-gray-400 mt-1">
              {t("feedback.lastUpdated")} {lastFetched.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => loadFeedback(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white shadow-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <LuRefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {t("feedback.refresh")}
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && <div className="flex items-center gap-2 flex-wrap">
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
            {opt === "all" ? t("feedback.all") : t(`feedback.status.${opt}`)}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} {t("feedback.items")}
        </span>
      </div>}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <LuLoaderCircle className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">
          {filter !== "all"
            ? `${t("feedback.noFeedback")} with status "${t(`feedback.status.${filter}`)}"`
            : t("feedback.noFeedback")}
        </p>
      ) : (
        <FeedbackAdminList items={filtered} onItemsChange={setItems} />
      )}
    </div>
  );
}
