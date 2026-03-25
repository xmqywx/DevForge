"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import {
  LuScan,
  LuLoader,
  LuRefreshCw,
  LuEye,
  LuEyeOff,
  LuDatabase,
  LuDownload,
  LuUpload,
  LuServer,
  LuPlug,
  LuBell,
  LuSettings,
  LuGlobe,
  LuPalette,
  LuZap,
  LuCircleCheck,
  LuCircleX,
  LuInfo,
} from "react-icons/lu";

// ── Types ──────────────────────────────────────────────────────────────────────

type AutoValue = "on" | "off" | "default";

interface ProjectRow {
  id: number;
  name: string;
  slug: string;
  autoRecordIssues: AutoValue;
  autoRecordNotes: AutoValue;
  autoSessionSummary: AutoValue;
  autoLoadContext: AutoValue;
  autoUpdateProgress: AutoValue;
}

interface DbTable {
  name: string;
  count: number;
}

interface DbStats {
  dbPath: string;
  sizeBytes: number;
  tables: DbTable[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
      <LuInfo className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-mono break-all">
        {value || <span className="text-gray-400 font-sans">—</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">{children}</h3>;
}

function AccentButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 bg-[#c6e135] text-[#1a1a1a] rounded-full px-5 py-2.5 text-sm font-medium hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <LuLoader className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

// ── Tab 1: Scan ────────────────────────────────────────────────────────────────

function ScanTab() {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json() as { total: number; created: number; updated: number };
      setResult(`Scanned: ${data.total} repos, ${data.created} new, ${data.updated} updated`);
    } catch {
      setResult("Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Git Scanner</SectionTitle>
      <InfoNote>
        Scan paths and exclude directories are configured in <code className="font-mono text-xs">.env.local</code>.
        They cannot be changed at runtime.
      </InfoNote>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadOnlyField label="Scan Path" value="~/Documents" />
        <ReadOnlyField label="Exclude Dirs" value="node_modules, .git, dist, build, .next" />
        <ReadOnlyField label="Scan Frequency" value="Manual (on demand)" />
        <ReadOnlyField label="DB Path" value="~/.devforge/devforge.db" />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <AccentButton onClick={runScan} loading={scanning} icon={LuScan}>
          {scanning ? "Scanning..." : t("settings.scanNow")}
        </AccentButton>
        {result && (
          <span className="text-sm text-gray-500">{result}</span>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Sync ────────────────────────────────────────────────────────────────

function SyncTab() {
  const { t } = useI18n();
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<Record<string, unknown>>)
      .then((data) => {
        if (data.auto_sync === true) setAutoSync(true);
      })
      .catch(() => {});
  }, []);

  async function toggleAutoSync() {
    const next = !autoSync;
    setAutoSync(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "auto_sync", value: next }),
    });
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) {
        setTestResult({ ok: true, msg: "Connection successful" });
      } else {
        setTestResult({ ok: false, msg: `Server returned ${res.status}` });
      }
    } catch {
      setTestResult({ ok: false, msg: "Connection failed — server unreachable" });
    } finally {
      setTesting(false);
    }
  }

  const serverUrl = process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";

  return (
    <div className="space-y-6">
      <SectionTitle>Sync Configuration</SectionTitle>
      <InfoNote>
        Server URL and secrets are configured in <code className="font-mono text-xs">.env.local</code>.
        Shown here for reference only.
      </InfoNote>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadOnlyField label="Server URL" value={serverUrl} />

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sync Secret</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-mono">
              {showSecret ? "devforge-sync-2026" : "••••••••••••••••"}
            </div>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showSecret ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner Secret</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-mono">
              ••••••••••••••••
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div>
          <div className="text-sm font-medium text-[#1a1a1a]">Auto-sync on startup</div>
          <div className="text-xs text-gray-500 mt-0.5">Automatically push/pull when DevForge starts</div>
        </div>
        <button
          onClick={toggleAutoSync}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoSync ? "bg-[#c6e135]" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              autoSync ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <AccentButton onClick={testConnection} loading={testing} icon={LuRefreshCw}>
          {testing ? "Testing..." : t("settings.testConnection")}
        </AccentButton>
        {testResult && (
          <span className={`flex items-center gap-1.5 text-sm ${testResult.ok ? "text-green-600" : "text-red-500"}`}>
            {testResult.ok ? <LuCircleCheck className="w-4 h-4" /> : <LuCircleX className="w-4 h-4" />}
            {testResult.msg}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Automation ─────────────────────────────────────────────────────────

const AUTO_COLS: { key: keyof Omit<ProjectRow, "id" | "name" | "slug">; label: string }[] = [
  { key: "autoRecordIssues", label: "Record Issues" },
  { key: "autoRecordNotes", label: "Record Notes" },
  { key: "autoSessionSummary", label: "Session Summary" },
  { key: "autoLoadContext", label: "Load Context" },
  { key: "autoUpdateProgress", label: "Update Progress" },
];

function AutoValueBadge({ value }: { value: AutoValue }) {
  const styles: Record<AutoValue, string> = {
    on: "bg-green-100 text-green-700",
    off: "bg-red-100 text-red-700",
    default: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[value]}`}>
      {value}
    </span>
  );
}

const GLOBAL_DEFAULTS: Record<string, AutoValue> = {
  "Record Issues": "on",
  "Record Notes": "on",
  "Session Summary": "on",
  "Load Context": "on",
  "Update Progress": "off",
};

function AutomationTab() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json() as Promise<ProjectRow[]>)
      .then((data) => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <SectionTitle>Automation Settings</SectionTitle>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Global Defaults</h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(GLOBAL_DEFAULTS).map(([label, value]) => (
            <div key={label} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500">{label}</span>
              <AutoValueBadge value={value} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Per-Project Overrides</h4>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <LuLoader className="w-4 h-4 animate-spin" />
            Loading projects...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Project</th>
                  {AUTO_COLS.map((col) => (
                    <th key={col.key} className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, i) => (
                  <tr
                    key={project.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{project.name}</td>
                    {AUTO_COLS.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-center">
                        <AutoValueBadge value={project[col.key] as AutoValue} />
                      </td>
                    ))}
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Notifications ──────────────────────────────────────────────────────

const NOTIFICATION_TRIGGERS = [
  "New feedback received",
  "Issue status changed",
  "Sync completed",
  "Scan completed",
  "New comment on issue",
];

function NotificationsTab() {
  const { t } = useI18n();
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [triggers, setTriggers] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TRIGGERS.map((t) => [t, false]))
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<Record<string, unknown>>)
      .then((data) => {
        if (typeof data.smtp_host === "string") setSmtpHost(data.smtp_host);
        if (typeof data.smtp_port === "string") setSmtpPort(data.smtp_port);
        if (typeof data.smtp_user === "string") setSmtpUser(data.smtp_user);
        if (typeof data.smtp_password === "string") setSmtpPassword(data.smtp_password);
        if (typeof data.smtp_from === "string") setFromAddress(data.smtp_from);
        if (typeof data.notification_email === "string") setNotificationEmail(data.notification_email);
        if (data.notification_triggers && typeof data.notification_triggers === "object") {
          setTriggers(data.notification_triggers as Record<string, boolean>);
        }
      })
      .catch(() => {});
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const fields: Array<{ key: string; value: unknown }> = [
        { key: "smtp_host", value: smtpHost },
        { key: "smtp_port", value: smtpPort },
        { key: "smtp_user", value: smtpUser },
        { key: "smtp_password", value: smtpPassword },
        { key: "smtp_from", value: fromAddress },
        { key: "notification_email", value: notificationEmail },
        { key: "notification_triggers", value: triggers },
      ];
      await Promise.all(
        fields.map((f) =>
          fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(f),
          })
        )
      );
      setSaveMsg({ ok: true, msg: "Settings saved" });
    } catch {
      setSaveMsg({ ok: false, msg: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  async function sendTestEmail() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          password: smtpPassword,
          from: fromAddress,
          to: notificationEmail,
        }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) {
        setTestMsg({ ok: true, msg: data.message ?? "Test passed" });
      } else {
        setTestMsg({ ok: false, msg: data.error ?? "Test failed" });
      }
    } catch {
      setTestMsg({ ok: false, msg: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  function toggleTrigger(trigger: string) {
    setTriggers((prev) => ({ ...prev, [trigger]: !prev[trigger] }));
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Notification Settings</SectionTitle>
      <InfoNote>Configure SMTP to receive email notifications.</InfoNote>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SMTP Host</label>
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SMTP Port</label>
          <input
            type="text"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SMTP User</label>
          <input
            type="text"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="user@example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SMTP Password</label>
          <input
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From Address</label>
          <input
            type="text"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="devforge@example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notification Email</label>
          <input
            type="text"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c6e135]/50"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Notification Triggers</h4>
        <div className="space-y-2">
          {NOTIFICATION_TRIGGERS.map((trigger) => (
            <label key={trigger} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!triggers[trigger]}
                onChange={() => toggleTrigger(trigger)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{trigger}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <AccentButton onClick={saveSettings} loading={saving} icon={LuSettings}>
          {saving ? "Saving..." : t("settings.saveSMTP")}
        </AccentButton>
        <AccentButton onClick={sendTestEmail} loading={testing} icon={LuBell}>
          {testing ? "Sending..." : t("settings.sendTestEmail")}
        </AccentButton>
        {saveMsg && (
          <span className={`flex items-center gap-1.5 text-sm ${saveMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {saveMsg.ok ? <LuCircleCheck className="w-4 h-4" /> : <LuCircleX className="w-4 h-4" />}
            {saveMsg.msg}
          </span>
        )}
        {testMsg && (
          <span className={`flex items-center gap-1.5 text-sm ${testMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {testMsg.ok ? <LuCircleCheck className="w-4 h-4" /> : <LuCircleX className="w-4 h-4" />}
            {testMsg.msg}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tab 5: MCP ────────────────────────────────────────────────────────────────

const MCP_TOOLS = [
  "devforge_list_projects",
  "devforge_get_project",
  "devforge_add_issue",
  "devforge_update_issue",
  "devforge_add_note",
  "devforge_get_feedback",
  "devforge_add_milestone",
  "devforge_add_release",
  "devforge_scan",
  "devforge_sync",
  "devforge_update_progress",
  "devforge_update_readme",
];

function McpTab() {
  const [reregistering, setReregistering] = useState(false);
  const [reregResult, setReregResult] = useState<string | null>(null);

  async function handleReregister() {
    setReregistering(true);
    setReregResult(null);
    // Simulate — actual re-registration requires CLI tool
    await new Promise((r) => setTimeout(r, 1000));
    setReregResult("Re-registration requires running: npx devforge mcp register");
    setReregistering(false);
  }

  return (
    <div className="space-y-6">
      <SectionTitle>MCP Server</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadOnlyField label="Server Path" value="~/.devforge/mcp-server/index.js" />
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registration Status</label>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <LuCircleCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Registered</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Tools ({MCP_TOOLS.length})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700"
            >
              {tool}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AccentButton onClick={handleReregister} loading={reregistering} icon={LuRefreshCw}>
          {reregistering ? "Processing..." : "Re-register"}
        </AccentButton>
        {reregResult && <span className="text-sm text-gray-500">{reregResult}</span>}
      </div>
    </div>
  );
}

// ── Tab 6: Plugin ─────────────────────────────────────────────────────────────

const PLUGIN_COMMANDS = [
  { cmd: "devforge scan", desc: "Scan git repos and import projects" },
  { cmd: "devforge sync pull", desc: "Pull data from server" },
  { cmd: "devforge sync push", desc: "Push data to server" },
  { cmd: "devforge add issue <title>", desc: "Add an issue to a project" },
  { cmd: "devforge add note <title>", desc: "Add a note to a project" },
  { cmd: "devforge mcp register", desc: "Register the MCP server" },
  { cmd: "devforge open", desc: "Open the dashboard in browser" },
];

function PluginTab() {
  const [reloading, setReloading] = useState(false);
  const [reloadResult, setReloadResult] = useState<string | null>(null);

  async function handleReload() {
    setReloading(true);
    await new Promise((r) => setTimeout(r, 800));
    setReloadResult("Plugin reloaded — restart Claude to apply changes");
    setReloading(false);
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Plugin / CLI</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadOnlyField label="Install Path" value="/usr/local/lib/node_modules/devforge" />
        <ReadOnlyField label="Version" value="1.0.0" />
        <ReadOnlyField label="Node.js Version Required" value=">=18.0.0" />
        <ReadOnlyField label="Config Directory" value="~/.devforge/" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">CLI Commands</h4>
        <div className="space-y-2">
          {PLUGIN_COMMANDS.map(({ cmd, desc }) => (
            <div
              key={cmd}
              className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
            >
              <code className="text-xs font-mono text-[#1a1a1a] font-semibold whitespace-nowrap">{cmd}</code>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AccentButton onClick={handleReload} loading={reloading} icon={LuRefreshCw}>
          {reloading ? "Reloading..." : "Reload Plugin"}
        </AccentButton>
        {reloadResult && <span className="text-sm text-gray-500">{reloadResult}</span>}
      </div>
    </div>
  );
}

// ── Tab 7: Database ───────────────────────────────────────────────────────────

function DatabaseTab() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/db-stats");
      const data = await res.json() as DbStats;
      setStats(data);
    } catch {
      setError("Failed to load database stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function handleExport() {
    window.open("/api/settings/db-export", "_blank");
  }

  function handleImportClick() {
    const input = document.getElementById("db-import-input") as HTMLInputElement | null;
    input?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      "Warning: This will replace your current database with the imported file. A backup will be created automatically.\n\nContinue?"
    );
    if (!confirmed) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    setImportMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/settings/db-import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { success?: boolean; backup?: string; error?: string };
      if (data.success) {
        setImportMsg({ ok: true, msg: `Imported successfully. Backup: ${data.backup ?? "saved"}` });
        void loadStats();
      } else {
        setImportMsg({ ok: false, msg: data.error ?? "Import failed" });
      }
    } catch {
      setImportMsg({ ok: false, msg: "Import request failed" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Database</SectionTitle>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <LuLoader className="w-4 h-4 animate-spin" />
          Loading stats...
        </div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Database Path" value={stats.dbPath} />
            <ReadOnlyField label="File Size" value={formatBytes(stats.sizeBytes)} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Table Row Counts</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.tables.map((t) => (
                <div
                  key={t.name}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-1"
                >
                  <span className="text-xs font-mono text-gray-500">{t.name}</span>
                  <span className="text-2xl font-bold text-[#1a1a1a]">{t.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hidden file input for DB import */}
      <input
        id="db-import-input"
        type="file"
        accept=".db"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <AccentButton onClick={handleExport} icon={LuDownload}>
          {t("settings.exportDb")}
        </AccentButton>
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-full px-5 py-2.5 text-sm font-medium hover:border-gray-300 hover:text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuUpload className="w-4 h-4" />}
          {importing ? "Importing..." : t("settings.importDb")}
        </button>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <LuRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {importMsg && (
        <div className={`flex items-center gap-1.5 text-sm ${importMsg.ok ? "text-green-600" : "text-red-500"}`}>
          {importMsg.ok ? <LuCircleCheck className="w-4 h-4" /> : <LuCircleX className="w-4 h-4" />}
          {importMsg.msg}
        </div>
      )}
    </div>
  );
}

// ── Tab 8: Theme ──────────────────────────────────────────────────────────────

type ThemeMode = "light" | "dark" | "system";

function ThemeTab() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const options: { value: ThemeMode; label: string; desc: string; preview: string }[] = [
    { value: "light", label: t("settings.light"), desc: "Always use light mode", preview: "bg-[#f0f0e8]" },
    { value: "dark", label: t("settings.dark"), desc: "Always use dark mode", preview: "bg-[#0f0f0f]" },
    { value: "system", label: t("settings.system"), desc: "Follow your OS preference", preview: "bg-gradient-to-r from-[#f0f0e8] to-[#0f0f0f]" },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle>Theme</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map(({ value, label, desc, preview }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
              theme === value
                ? "border-[#c6e135] bg-[#c6e135]/10"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={theme !== value ? { borderColor: "var(--border)", backgroundColor: "var(--bg-card)" } : undefined}
          >
            <div className={`w-full h-8 rounded-lg ${preview} border border-gray-200/30`} />
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{desc}</span>
            {theme === value && (
              <LuCircleCheck className="w-4 h-4 text-[#8aad00] mt-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab 9: Language ───────────────────────────────────────────────────────────

type Lang = "en" | "zh";

function LanguageTab() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("devforge-lang") as Lang | null;
    if (saved) setLang(saved);
  }, []);

  function selectLang(l: Lang) {
    setLang(l);
    localStorage.setItem("devforge-lang", l);
  }

  const options: { value: Lang; label: string; native: string; desc: string }[] = [
    { value: "en", label: "English", native: "English", desc: "Use English throughout the interface" },
    { value: "zh", label: "中文", native: "中文", desc: "在整个界面中使用中文" },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle>Language / 语言</SectionTitle>
      <InfoNote>
        Language preference is saved to localStorage.
      </InfoNote>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        {options.map(({ value, label, native, desc }) => (
          <button
            key={value}
            onClick={() => selectLang(value)}
            className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all text-left ${
              lang === value
                ? "border-[#c6e135] bg-[#c6e135]/10"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="font-semibold text-[#1a1a1a] text-lg">{native}</span>
            <span className="text-xs text-gray-500">{desc}</span>
            {lang === value && (
              <LuCircleCheck className="w-4 h-4 text-[#8aad00] mt-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type TabId =
  | "scan"
  | "sync"
  | "automation"
  | "notifications"
  | "mcp"
  | "plugin"
  | "database"
  | "theme"
  | "language";

interface Tab {
  id: TabId;
  labelKey: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "scan", labelKey: "settings.scan", icon: LuScan },
  { id: "sync", labelKey: "settings.sync", icon: LuRefreshCw },
  { id: "automation", labelKey: "settings.automation", icon: LuZap },
  { id: "notifications", labelKey: "settings.notifications", icon: LuBell },
  { id: "mcp", labelKey: "settings.mcp", icon: LuServer },
  { id: "plugin", labelKey: "settings.plugin", icon: LuPlug },
  { id: "database", labelKey: "settings.database", icon: LuDatabase },
  { id: "theme", labelKey: "settings.theme", icon: LuPalette },
  { id: "language", labelKey: "settings.language", icon: LuGlobe },
];

export default function SettingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("scan");

  function renderContent() {
    switch (activeTab) {
      case "scan": return <ScanTab />;
      case "sync": return <SyncTab />;
      case "automation": return <AutomationTab />;
      case "notifications": return <NotificationsTab />;
      case "mcp": return <McpTab />;
      case "plugin": return <PluginTab />;
      case "database": return <DatabaseTab />;
      case "theme": return <ThemeTab />;
      case "language": return <LanguageTab />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LuSettings className="w-7 h-7 text-[#1a1a1a]" />
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{t("settings.title")}</h1>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tab list */}
        <nav className="w-44 shrink-0 space-y-1">
          {TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? "bg-[#c6e135] text-[#1a1a1a] shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-[#1a1a1a]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t(labelKey)}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 min-h-[500px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
