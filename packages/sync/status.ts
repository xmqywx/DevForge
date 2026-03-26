import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { SyncStatus, SyncLogEntry } from "./types";

const STATUS_PATH = resolve(process.env.HOME ?? "~", ".devforge/sync-status.json");
const MAX_HISTORY = 50;

const EMPTY_STATUS: SyncStatus = {
  lastPush: null,
  lastPull: null,
  lastPushResult: null,
  lastPullResult: null,
  lastError: null,
  history: [],
};

export function getSyncStatus(): SyncStatus {
  if (!existsSync(STATUS_PATH)) return { ...EMPTY_STATUS };
  try {
    return JSON.parse(readFileSync(STATUS_PATH, "utf-8"));
  } catch {
    return { ...EMPTY_STATUS };
  }
}

export function saveSyncStatus(direction: "push" | "pull", result: "ok" | "error", summary: string): void {
  const status = getSyncStatus();
  const now = new Date().toISOString();

  if (direction === "push") {
    status.lastPush = now;
    status.lastPushResult = result;
  } else {
    status.lastPull = now;
    status.lastPullResult = result;
  }

  if (result === "error") status.lastError = summary;

  const entry: SyncLogEntry = { timestamp: now, direction, result, summary };
  status.history.unshift(entry);
  if (status.history.length > MAX_HISTORY) status.history = status.history.slice(0, MAX_HISTORY);

  const dir = dirname(STATUS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), "utf-8");
}
