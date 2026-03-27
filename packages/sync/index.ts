import { getConfig } from "./config";
import { pushToServer, pushProject } from "./push";
import { pullFromServer } from "./pull";
import { getSyncStatus } from "./status";
import type { SyncConfig, PushResult, PullResult, SyncStatus } from "./types";

export class SyncService {
  private config: SyncConfig;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: Partial<SyncConfig>) {
    const base = getConfig();
    this.config = config ? { ...base, ...config } : base;
  }

  get enabled(): boolean {
    return this.config.server.enabled && !!this.config.server.url;
  }

  async push(): Promise<PushResult> {
    if (!this.enabled) return { skipped: true };
    return pushToServer(this.config);
  }

  async pull(): Promise<PullResult> {
    if (!this.enabled) return { skipped: true };
    return pullFromServer(this.config);
  }

  async sync(): Promise<{ push: PushResult; pull: PullResult }> {
    const pushResult = await this.push();
    const pullResult = await this.pull();
    return { push: pushResult, pull: pullResult };
  }

  /**
   * Debounced push — coalesces rapid writes into one push.
   * Used by API routes after DB writes.
   */
  debouncedPush(): void {
    if (!this.enabled || !this.config.sync.autoPushOnWrite) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.push().catch(() => {});
    }, this.config.sync.pushDebounceMs);
  }

  /**
   * Push a single project (fire-and-forget).
   * Used after writing data for a specific project.
   */
  pushProjectById(projectId: string): void {
    if (!this.enabled) return;
    pushProject(this.config, projectId);
  }

  /**
   * Full rebuild: push ALL data to server (for disaster recovery).
   */
  async rebuild(): Promise<PushResult> {
    if (!this.enabled) return { skipped: true };
    // First tell server to clear, then push
    try {
      await fetch(`${this.config.server.url}/api/sync/rebuild`, {
        method: "POST",
        headers: { "x-sync-secret": this.config.server.syncSecret },
      });
    } catch {}
    return this.push();
  }

  status(): SyncStatus {
    return getSyncStatus();
  }
}

// Singleton
let _instance: SyncService | null = null;
export function getSyncService(): SyncService {
  if (!_instance) _instance = new SyncService();
  return _instance;
}

// Re-exports for convenience
export { getConfig, saveConfig } from "./config";
export { newId } from "./uuid";
export { getSyncStatus } from "./status";
export type { SyncConfig, SyncPayload, PushResult, PullResult, SyncStatus, SyncLogEntry } from "./types";
export { notify, notifyNewFeedback, notifyFeedbackReply, notifyIssueChange, notifyNewRelease, notifySyncComplete } from "./notify";
