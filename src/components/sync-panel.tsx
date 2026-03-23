"use client";

import { useState, useEffect, useCallback } from "react";

// ---- Types ----

interface SyncLogEntry {
  timestamp: string;
  direction: "PUSH" | "PULL" | "FULL";
  summary: string;
  status: "ok" | "error";
}

interface StatusData {
  serverOnline: boolean;
  serverUrl: string;
  localCounts: Record<string, number>;
  serverCounts: Record<string, number> | null;
}

// ---- localStorage helpers ----

const LS_PUSH_KEY = "devforge:lastPush";
const LS_PULL_KEY = "devforge:lastPull";
const LS_LOG_KEY = "devforge:syncLog";
const LS_AUTO_KEY = "devforge:autoSync";

function getLog(): SyncLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function appendLog(entry: SyncLogEntry) {
  const log = getLog();
  log.unshift(entry);
  localStorage.setItem(LS_LOG_KEY, JSON.stringify(log.slice(0, 20)));
}

function formatTime(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleString();
}

// ---- Sub-components ----

function StatusCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div
        className={`text-lg font-bold truncate ${
          accent ? "text-[#c6e135]" : "text-[#1a1a1a]"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function DirectionPill({ dir }: { dir: "PUSH" | "PULL" | "FULL" }) {
  const styles: Record<string, string> = {
    PUSH: "bg-blue-100 text-blue-700",
    PULL: "bg-purple-100 text-purple-700",
    FULL: "bg-[#c6e135] text-[#1a1a1a]",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${styles[dir]}`}
    >
      {dir}
    </span>
  );
}

// ---- Main component ----

export function SyncPanel() {
  const [lastPush, setLastPush] = useState<string | null>(null);
  const [lastPull, setLastPull] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [running, setRunning] = useState<"push" | "pull" | "full" | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setLastPush(localStorage.getItem(LS_PUSH_KEY));
    setLastPull(localStorage.getItem(LS_PULL_KEY));
    setAutoSync(localStorage.getItem(LS_AUTO_KEY) === "true");
    setLog(getLog());
  }, []);

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const addLogEntry = (entry: SyncLogEntry) => {
    appendLog(entry);
    setLog(getLog());
  };

  const runPush = async (): Promise<boolean> => {
    const res = await fetch("/api/sync/push", { method: "POST" });
    const data = await res.json();
    const now = new Date().toISOString();
    const ok = res.ok && data.success;
    addLogEntry({
      timestamp: now,
      direction: "PUSH",
      summary: ok ? data.summary : data.error ?? "Push failed",
      status: ok ? "ok" : "error",
    });
    if (ok) {
      localStorage.setItem(LS_PUSH_KEY, now);
      setLastPush(now);
    }
    return ok;
  };

  const runPull = async (): Promise<boolean> => {
    const res = await fetch("/api/sync/pull", { method: "POST" });
    const data = await res.json();
    const now = new Date().toISOString();
    const ok = res.ok && data.success;
    addLogEntry({
      timestamp: now,
      direction: "PULL",
      summary: ok ? data.summary : data.error ?? "Pull failed",
      status: ok ? "ok" : "error",
    });
    if (ok) {
      localStorage.setItem(LS_PULL_KEY, now);
      setLastPull(now);
    }
    return ok;
  };

  const handlePush = async () => {
    setRunning("push");
    try {
      await runPush();
      await refreshStatus();
    } finally {
      setRunning(null);
    }
  };

  const handlePull = async () => {
    setRunning("pull");
    try {
      await runPull();
      await refreshStatus();
    } finally {
      setRunning(null);
    }
  };

  const handleFullSync = async () => {
    setRunning("full");
    try {
      const pushOk = await runPush();
      const pullOk = await runPull();
      const now = new Date().toISOString();
      addLogEntry({
        timestamp: now,
        direction: "FULL",
        summary: `Full sync: push ${pushOk ? "OK" : "FAILED"}, pull ${pullOk ? "OK" : "FAILED"}`,
        status: pushOk && pullOk ? "ok" : "error",
      });
      await refreshStatus();
    } finally {
      setRunning(null);
    }
  };

  const toggleAutoSync = () => {
    const next = !autoSync;
    setAutoSync(next);
    localStorage.setItem(LS_AUTO_KEY, String(next));
  };

  const statsRows = [
    { label: "Projects", key: "projects" },
    { label: "Issues", key: "issues" },
    { label: "Notes", key: "notes" },
    { label: "Releases", key: "releases" },
    { label: "Milestones", key: "milestones" },
    { label: "Feedback", key: "feedback" },
  ];

  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard
          label="Last Push"
          value={lastPush ? formatTime(lastPush).split(",")[0] : "Never"}
          sub={lastPush ? formatTime(lastPush).split(",")[1]?.trim() : undefined}
        />
        <StatusCard
          label="Last Pull"
          value={lastPull ? formatTime(lastPull).split(",")[0] : "Never"}
          sub={lastPull ? formatTime(lastPull).split(",")[1]?.trim() : undefined}
        />
        <StatusCard
          label="Server"
          value={
            loadingStatus
              ? "Checking..."
              : status?.serverOnline
              ? "Online"
              : "Offline"
          }
          sub={status?.serverUrl ?? "—"}
          accent={status?.serverOnline}
        />
        <StatusCard
          label="Auto-Sync"
          value={autoSync ? "ON" : "OFF"}
          sub={autoSync ? "Enabled" : "Disabled"}
          accent={autoSync}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Sync Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePush}
            disabled={running !== null}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running === "push" ? "Pushing..." : "Push Now"}
          </button>
          <button
            onClick={handlePull}
            disabled={running !== null}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running === "pull" ? "Pulling..." : "Pull Now"}
          </button>
          <button
            onClick={handleFullSync}
            disabled={running !== null}
            className="px-5 py-2.5 rounded-xl bg-[#c6e135] text-[#1a1a1a] text-sm font-semibold hover:bg-[#b5d020] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running === "full" ? "Syncing..." : "Full Sync"}
          </button>
          <button
            onClick={refreshStatus}
            disabled={loadingStatus}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loadingStatus ? "Refreshing..." : "Refresh Status"}
          </button>
          <button
            onClick={toggleAutoSync}
            className={`ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              autoSync
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Auto-Sync: {autoSync ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Stats Comparison Table */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Data Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-gray-500 font-medium py-2 pr-6">Data</th>
                <th className="text-right text-gray-500 font-medium py-2 pr-6">Local</th>
                <th className="text-right text-gray-500 font-medium py-2 pr-6">Server</th>
                <th className="text-right text-gray-500 font-medium py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {statsRows.map((row) => {
                const local = status?.localCounts?.[row.key] ?? 0;
                const server = status?.serverCounts?.[row.key] ?? null;
                const inSync =
                  server !== null ? local === server : null;
                return (
                  <tr key={row.key} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-6 font-medium text-[#1a1a1a]">{row.label}</td>
                    <td className="py-3 pr-6 text-right tabular-nums">{local}</td>
                    <td className="py-3 pr-6 text-right tabular-nums text-gray-500">
                      {loadingStatus ? "..." : server !== null ? server : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {inSync === null ? (
                        <span className="text-gray-400 text-xs">N/A</span>
                      ) : inSync ? (
                        <span className="text-green-600 text-xs font-medium">In sync</span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">Out of sync</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Log */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1a1a]">Sync Log</h2>
          <span className="text-xs text-gray-400">Last {Math.min(log.length, 20)} operations</span>
        </div>
        {log.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No sync operations recorded yet. Run a sync to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {log.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                  entry.status === "ok" ? "bg-gray-50" : "bg-red-50"
                }`}
              >
                <div className="flex-shrink-0 w-36 text-xs text-gray-400 pt-0.5">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="flex-shrink-0">
                  <DirectionPill dir={entry.direction} />
                </div>
                <div className="flex-1 text-gray-700">{entry.summary}</div>
                <div className="flex-shrink-0">
                  {entry.status === "ok" ? (
                    <span className="text-green-600 text-xs font-semibold">OK</span>
                  ) : (
                    <span className="text-red-600 text-xs font-semibold">Error</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
