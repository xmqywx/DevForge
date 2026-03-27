"use client";

import { useCallback, useRef } from "react";
import { useDevForgeWS } from "@/hooks/use-ws";

export function WSListener() {
  const syncingRef = useRef(false);

  // Trigger sync pull when WS event received
  const triggerPull = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await fetch("/api/sync-pull", { method: "POST" });
    } catch {
      // silent
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const handleEvent = useCallback(
    (event: { type: string; data: any }) => {
      console.log("[DevForge WS] Event:", event.type, event.data);

      // Show browser notification
      if (Notification.permission === "granted") {
        const titles: Record<string, string> = {
          new_feedback: "新反馈",
          new_reply: "新回复",
          new_comment: "新评论",
          new_vote: "新投票",
        };
        const title = titles[event.type] ?? "DevForge 通知";
        const body =
          event.data?.title ??
          event.data?.feedbackTitle ??
          event.data?.issueTitle ??
          "";
        new Notification(title, {
          body: `${body} — ${event.data?.authorName ?? ""}`,
          icon: "/favicon.ico",
        });
      }

      // Trigger sync pull to update local DB
      triggerPull();

      // Dispatch custom event so pages can react
      window.dispatchEvent(
        new CustomEvent("devforge-ws-event", { detail: event })
      );
    },
    [triggerPull]
  );

  useDevForgeWS(handleEvent);

  // Request notification permission on first render
  if (typeof window !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }

  return null; // No UI
}
