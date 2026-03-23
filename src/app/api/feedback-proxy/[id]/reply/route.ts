import { ownerReply } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const result = await ownerReply(Number(id), content);
    return Response.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reply failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
