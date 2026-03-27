import { getConfig } from "./config";

interface NotifyOptions {
  title: string;
  content: string;
  project?: string;
  type?: "feedback" | "reply" | "issue" | "release" | "sync" | "info";
  url?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  feedback: "💬",
  reply: "↩️",
  issue: "🐛",
  release: "🚀",
  sync: "🔄",
  info: "ℹ️",
};

/**
 * Send a notification to Feishu webhook.
 * Fire-and-forget — never blocks, never throws.
 */
export function notify(options: NotifyOptions): void {
  const config = getConfig();
  const webhook = config.notifications?.feishuWebhook;
  if (!webhook) return;

  const emoji = TYPE_EMOJI[options.type ?? "info"] ?? "📌";

  // Feishu webhook message format (Interactive Card)
  const card = {
    msg_type: "interactive",
    card: {
      header: {
        title: {
          tag: "plain_text",
          content: `${emoji} ${options.title}`,
        },
        template: options.type === "feedback" ? "orange" :
                  options.type === "release" ? "green" :
                  options.type === "issue" ? "red" :
                  options.type === "sync" ? "blue" : "turquoise",
      },
      elements: [
        {
          tag: "markdown",
          content: options.content + (options.project ? `\n**项目:** ${options.project}` : ""),
        },
        ...(options.url ? [{
          tag: "action",
          actions: [{
            tag: "button",
            text: { tag: "plain_text", content: "查看详情" },
            url: options.url,
            type: "primary",
          }],
        }] : []),
        {
          tag: "note",
          elements: [{
            tag: "plain_text",
            content: `DevForge · ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
          }],
        },
      ],
    },
  };

  fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  }).catch(() => {
    // Fire-and-forget
  });
}

// Convenience helpers

export function notifyNewFeedback(title: string, author: string, project: string, feedbackId: string): void {
  const serverUrl = getConfig().server.url;
  notify({
    title: "收到新反馈",
    content: `**${title}**\n提交人: ${author}`,
    project,
    type: "feedback",
    url: serverUrl ? `${serverUrl}/projects/${project}/feedback/${feedbackId}` : undefined,
  });
}

export function notifyFeedbackReply(feedbackTitle: string, author: string, content: string, isOwner: boolean): void {
  notify({
    title: isOwner ? "Owner 回复了反馈" : "用户回复了反馈",
    content: `**${feedbackTitle}**\n${author}: ${content.replace(/<[^>]*>/g, "").slice(0, 100)}`,
    type: "reply",
  });
}

export function notifyIssueChange(title: string, project: string, action: string, detail?: string): void {
  notify({
    title: `Issue ${action}`,
    content: `**${title}**${detail ? `\n${detail}` : ""}`,
    project,
    type: "issue",
  });
}

export function notifyNewRelease(version: string, title: string, project: string): void {
  const serverUrl = getConfig().server.url;
  notify({
    title: `发布 ${version}`,
    content: `**${title}**`,
    project,
    type: "release",
    url: serverUrl ? `${serverUrl}/projects/${project}` : undefined,
  });
}

export function notifySyncComplete(direction: "push" | "pull" | "full", summary: string): void {
  notify({
    title: `同步${direction === "push" ? "推送" : direction === "pull" ? "拉取" : ""}完成`,
    content: summary,
    type: "sync",
  });
}
