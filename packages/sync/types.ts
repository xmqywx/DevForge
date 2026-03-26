// Data ownership model
export type LocalMaster = "projects" | "issues" | "notes" | "releases" | "milestones" | "git_snapshots";
export type ServerMaster = "feedback" | "feedback_replies" | "feedback_votes" | "issue_votes";
export type Bidirectional = "issue_comments";

export interface SyncConfig {
  server: {
    url: string;
    syncSecret: string;
    ownerSecret: string;
    enabled: boolean;
  };
  sync: {
    autoPushOnWrite: boolean;
    autoPullOnWsEvent: boolean;
    pullIntervalSeconds: number;
    pushDebounceMs: number;
  };
  notifications: {
    feishuWebhook: string | null;
    email: string | null;
  };
}

export interface SyncPayload {
  projects?: any[];
  issues?: any[];
  notes?: any[];
  releases?: any[];
  milestones?: any[];
  git_snapshots?: any[];
}

export interface PushResult {
  skipped?: boolean;
  success?: boolean;
  counts?: Record<string, number>;
  error?: string;
}

export interface PullResult {
  skipped?: boolean;
  success?: boolean;
  counts?: { feedback: number; replies: number; votes: number; comments: number };
  error?: string;
}

export interface SyncLogEntry {
  timestamp: string;
  direction: "push" | "pull" | "full";
  result: "ok" | "error";
  summary: string;
}

export interface SyncStatus {
  lastPush: string | null;
  lastPull: string | null;
  lastPushResult: "ok" | "error" | null;
  lastPullResult: "ok" | "error" | null;
  lastError: string | null;
  history: SyncLogEntry[];
}
