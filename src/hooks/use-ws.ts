"use client";

import { useEffect, useRef, useCallback } from "react";

type WSEvent = {
  type: "new_feedback" | "new_reply" | "new_comment" | "new_vote";
  data: any;
};

export function useDevForgeWS(onEvent: (event: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const serverUrl = process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
    const wsUrl = serverUrl.replace("https://", "wss://").replace("http://", "ws://") + "/ws";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log("[DevForge WS] Connected");

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as WSEvent;
          onEvent(event);
        } catch {}
      };

      ws.onclose = () => {
        console.log("[DevForge WS] Disconnected, reconnecting in 5s...");
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [onEvent]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
}
