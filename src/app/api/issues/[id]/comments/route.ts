import { db } from "@/db/client";
import { issueComments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SERVER_URL =
  process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";
const SYNC_SECRET =
  process.env.DEVFORGE_SYNC_SECRET ?? "devforge-sync-2026";
const OWNER_SECRET =
  process.env.DEVFORGE_OWNER_SECRET ?? "devforge-owner-2026";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch local comments
  const localComments = db
    .select()
    .from(issueComments)
    .where(eq(issueComments.issueId, id))
    .all();

  // Try fetching from server (best-effort)
  let serverComments: any[] = [];
  try {
    const res = await fetch(`${SERVER_URL}/api/issues/${id}/comments`, {
      headers: { "x-sync-secret": SYNC_SECRET },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      serverComments = Array.isArray(data) ? data : (data.comments ?? []);
    }
  } catch {
    // Server unreachable — use local only
  }

  // Merge: server comments first, then local-only ones (avoid duplicates by id)
  // Server comments have their own IDs; prefix them with "s-" in the merged result
  // so the UI can distinguish. Local comments use string UUIDs.
  const merged = [
    ...serverComments.map((c: any) => ({
      id: `s-${c.id}`,
      issueId: c.issueId ?? id,
      authorName: c.authorName ?? c.author_name ?? "Anonymous",
      isOwner: c.isOwner ?? c.is_owner ?? false,
      content: c.content ?? "",
      createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
      fromServer: true,
    })),
    ...localComments.map((c) => ({
      id: c.id,
      issueId: c.issueId,
      authorName: c.authorName ?? "Anonymous",
      isOwner: c.isOwner ?? false,
      content: c.content,
      createdAt: c.createdAt,
      fromServer: false,
    })),
  ];

  // Sort by createdAt ascending
  merged.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return Response.json(merged);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const content: string = body.content?.trim() ?? "";
  if (!content) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const authorName = body.author ?? "Owner";
  const now = new Date().toISOString();

  // Save to local DB
  const row = db
    .insert(issueComments)
    .values({
      issueId: id,
      authorName,
      isOwner: true,
      content,
      createdAt: now,
    })
    .returning()
    .get();

  // Also POST to server (best-effort)
  try {
    await fetch(`${SERVER_URL}/api/issues/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-owner-secret": OWNER_SECRET,
      },
      body: JSON.stringify({
        issueId: id,
        content,
        author: "Owner",
        authorName: "Owner",
        isOwner: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Fire-and-forget — local save already succeeded
  }

  return Response.json(row, { status: 201 });
}
