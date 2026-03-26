import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { SyncConfig } from "./types";

const CONFIG_PATH = resolve(process.env.HOME ?? "~", ".devforge/config.json");

const DEFAULT_CONFIG: SyncConfig = {
  server: {
    url: "",
    syncSecret: "",
    ownerSecret: "",
    enabled: false,
  },
  sync: {
    autoPushOnWrite: true,
    autoPullOnWsEvent: true,
    pullIntervalSeconds: 0,
    pushDebounceMs: 2000,
  },
  notifications: {
    feishuWebhook: null,
    email: null,
  },
};

export function getConfig(): SyncConfig {
  // 1. Read file config
  let fileConfig: Partial<SyncConfig> = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch { /* invalid json, use defaults */ }
  }

  // 2. Deep merge with defaults
  const config = deepMerge(DEFAULT_CONFIG, fileConfig) as SyncConfig;

  // 3. Environment variable overrides (highest priority)
  if (process.env.DEVFORGE_SERVER_URL) config.server.url = process.env.DEVFORGE_SERVER_URL;
  if (process.env.DEVFORGE_SYNC_SECRET) config.server.syncSecret = process.env.DEVFORGE_SYNC_SECRET;
  if (process.env.DEVFORGE_OWNER_SECRET) config.server.ownerSecret = process.env.DEVFORGE_OWNER_SECRET;
  if (process.env.DEVFORGE_FEISHU_WEBHOOK) config.notifications.feishuWebhook = process.env.DEVFORGE_FEISHU_WEBHOOK;

  // Auto-enable if URL and secret are set
  if (config.server.url && config.server.syncSecret) {
    config.server.enabled = true;
  }

  return config;
}

export function saveConfig(config: Partial<SyncConfig>): void {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let existing: any = {};
  if (existsSync(CONFIG_PATH)) {
    try { existing = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")); } catch {}
  }

  const merged = deepMerge(existing, config);
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] ?? {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
