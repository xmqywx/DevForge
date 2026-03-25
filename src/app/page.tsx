"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// ---- Types ----

interface OverviewStats {
  totalProjects: number;
  publicProjects: number;
  openIssues: number;
  unreadFeedback: number;
}

interface ActivityItem {
  id: string;
  type: "issue" | "feedback" | "release" | "note";
  subtype?: string;
  title: string;
  projectName: string;
  projectSlug: string;
  createdAt: string;
}

interface OverviewData {
  stats: OverviewStats;
  recentActivity: ActivityItem[];
}

// ---- Helpers ----

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr.includes("T") ? dateStr : dateStr + "Z");
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getActivityIcon(type: ActivityItem["type"], subtype?: string): string {
  if (type === "issue") {
    if (subtype === "bug") return "🐛";
    if (subtype === "feature") return "✨";
    if (subtype === "improvement") return "⚡";
    return "📋";
  }
  if (type === "feedback") return "💬";
  if (type === "release") return "🚀";
  if (type === "note") return "📝";
  return "📌";
}

function getActivityColor(type: ActivityItem["type"], subtype?: string): string {
  if (type === "issue") {
    if (subtype === "bug") return "bg-red-100 text-red-700";
    if (subtype === "feature") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  }
  if (type === "feedback") return "bg-purple-100 text-purple-700";
  if (type === "release") return "bg-green-100 text-green-700";
  if (type === "note") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function getTypePill(type: ActivityItem["type"], subtype?: string): string {
  if (type === "release" && subtype) return `v${subtype}`;
  return subtype ?? type;
}

// ---- Stats Card ----

interface StatsCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function StatsCard({ label, value, accent }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex-1 min-w-0">
      <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-4xl font-bold ${accent ? "text-[#1a1a1a]" : "text-[#c6e135]"}`}>
        {value}
      </div>
    </div>
  );
}

// ---- Quick Action Button ----

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

function ActionButton({ label, onClick, href, loading, variant = "secondary" }: ActionButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium text-sm transition-all min-w-[100px]";
  const styles =
    variant === "primary"
      ? `${base} bg-[#c6e135] text-[#1a1a1a] hover:bg-[#b5d020]`
      : `${base} bg-white border border-gray-200 text-[#1a1a1a] hover:bg-gray-50 shadow-sm`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={loading} className={`${styles} disabled:opacity-60`}>
      {loading ? "..." : label}
    </button>
  );
}

// ---- Main Page ----

export default function OverviewPage() {
  const { t } = useI18n();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");
  const [actionState, setActionState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Read last sync time from localStorage
    const stored = localStorage.getItem("devforge_last_sync");
    if (stored) setLastSync(relativeTime(stored));
    else setLastSync(t("overview.never"));

    // Fetch overview data
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d: OverviewData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function runAction(key: string, url: string, method = "POST") {
    setActionState((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`${res.status}`);
      if (key === "scan" || key === "push" || key === "pull") {
        const now = new Date().toISOString();
        localStorage.setItem("devforge_last_sync", now);
        setLastSync(relativeTime(now));
        // Refresh data
        const overview = await fetch("/api/overview").then((r) => r.json());
        setData(overview);
      }
    } catch (err) {
      console.error(`Action ${key} failed:`, err);
    } finally {
      setActionState((s) => ({ ...s, [key]: false }));
    }
  }

  const stats = data?.stats;
  const activity = data?.recentActivity ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("overview.title")}</h1>
        <span className="text-sm text-gray-400">{t("overview.lastSync")}: {lastSync || t("overview.never")}</span>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
        <StatsCard label={t("overview.totalProjects")} value={loading ? "—" : (stats?.totalProjects ?? 0)} />
        <StatsCard label={t("overview.publicProjects")} value={loading ? "—" : (stats?.publicProjects ?? 0)} />
        <StatsCard label={t("overview.openIssues")} value={loading ? "—" : (stats?.openIssues ?? 0)} />
        <StatsCard label={t("overview.unreadFeedback")} value={loading ? "—" : (stats?.unreadFeedback ?? 0)} />
        <div className="bg-[#c6e135] rounded-2xl shadow-sm p-6 flex-1 min-w-0">
          <div className="text-sm text-[#1a1a1a]/60 uppercase tracking-wide mb-1">{t("overview.lastSync")}</div>
          <div className="text-xl font-bold text-[#1a1a1a] truncate">{lastSync || t("overview.never")}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {t("overview.quickActions")}
        </h2>
        <div className="flex gap-3 flex-wrap">
          <ActionButton
            label={actionState.scan ? t("overview.scanning") : t("overview.scanGit")}
            onClick={() => runAction("scan", "/api/scan")}
            loading={actionState.scan}
            variant="primary"
          />
          <ActionButton
            label={actionState.push ? t("overview.pushing") : t("overview.pushServer")}
            onClick={() => runAction("push", "/api/sync/push")}
            loading={actionState.push}
          />
          <ActionButton
            label={actionState.pull ? t("overview.pulling") : t("overview.pullFeedback")}
            onClick={() => runAction("pull", "/api/sync/pull")}
            loading={actionState.pull}
          />
          <ActionButton label={t("issues.newIssue")} href="/issues" />
          <ActionButton label={t("overview.newRelease")} href="/releases" />
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-5">{t("overview.recentActivity")}</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            {t("overview.noActivity")}
          </p>
        ) : (
          <div className="space-y-1">
            {activity.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                {/* Timeline line + icon */}
                <div className="relative flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-base">
                    {getActivityIcon(item.type, item.subtype)}
                  </div>
                  {idx < activity.length - 1 && (
                    <div className="absolute top-8 w-px h-full bg-gray-100" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#1a1a1a] truncate leading-snug">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      href={`/projects/${item.projectSlug}`}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate"
                    >
                      {item.projectName}
                    </Link>
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getActivityColor(item.type, item.subtype)}`}
                    >
                      {getTypePill(item.type, item.subtype)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
