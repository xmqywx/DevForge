const SERVER_URL =
  process.env.NEXT_PUBLIC_DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET = process.env.DEVFORGE_SYNC_SECRET ?? "";
const OWNER_SECRET = process.env.DEVFORGE_OWNER_SECRET ?? "";

export { SERVER_URL };

/**
 * Wrapper around fetch that prepends the server base URL and attaches
 * the sync secret header for authenticated endpoints.
 */
export async function serverFetch(path: string, options?: RequestInit) {
  const url = `${SERVER_URL}${path}`;
  const headers = new Headers(options?.headers);
  if (SYNC_SECRET) headers.set("x-sync-secret", SYNC_SECRET);
  return fetch(url, { ...options, headers });
}

/**
 * Upload a file to the server's /api/upload endpoint.
 * Returns the server-relative URL (e.g. /uploads/xxx.png).
 */
export async function serverUpload(file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch(`${SERVER_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  // server returns { urls: ["/uploads/xxx.png"] }
  return data.urls?.[0] ?? "";
}

/**
 * Post a reply as the owner. Should be called from a server-side API route
 * so OWNER_SECRET is never exposed to the client.
 */
export async function ownerReply(feedbackId: string, content: string) {
  const res = await fetch(`${SERVER_URL}/api/feedback/${feedbackId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-owner-secret": OWNER_SECRET,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reply failed: ${text}`);
  }
  return res.json();
}
