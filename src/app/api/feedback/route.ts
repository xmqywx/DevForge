import { type NextRequest } from "next/server";
import { db } from "@/db/client";
import { feedback, projects } from "@/db/schema";
import { eq, and, desc, ne, sql } from "drizzle-orm";
import { checkHoneypot, checkRateLimit } from "@/lib/anti-spam";
import { sendFeedbackNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type");

  const conditions = [ne(feedback.status, "spam")];
  if (projectId) conditions.push(eq(feedback.projectId, Number(projectId)));
  if (status) conditions.push(eq(feedback.status, status as typeof feedback.status.enumValues[number]));
  if (type) conditions.push(eq(feedback.type, type as typeof feedback.type.enumValues[number]));

  const rows = db
    .select()
    .from(feedback)
    .where(and(...conditions))
    .orderBy(desc(feedback.upvotes), desc(feedback.createdAt))
    .all();

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Honeypot check
  if (checkHoneypot(body)) {
    // Silently accept to not tip off bots
    return Response.json({ id: 0 }, { status: 201 });
  }

  // Rate limit check
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  if (checkRateLimit(ip)) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  if (!body.title || !body.projectId) {
    return Response.json({ error: "title and projectId are required" }, { status: 400 });
  }

  const row = db
    .insert(feedback)
    .values({
      projectId: body.projectId,
      authorName: body.authorName || "匿名",
      authorIp: ip,
      title: body.title,
      description: body.description ?? "",
      type: body.type ?? "feature",
      images: body.images ?? [],
    })
    .returning()
    .get();

  // Send email notification (non-blocking)
  const project = db.select().from(projects).where(eq(projects.id, body.projectId)).get();
  sendFeedbackNotification(
    { id: row.id, title: row.title, type: row.type ?? "feature", description: row.description ?? "", authorName: row.authorName },
    project?.name ?? "Unknown Project"
  ).catch(() => {}); // silently fail

  return Response.json(row, { status: 201 });
}
