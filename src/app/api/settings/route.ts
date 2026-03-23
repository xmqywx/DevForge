import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db.select().from(settings).all();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const body = await request.json() as { key: string; value: unknown };
  const { key, value } = body;
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
  return NextResponse.json({ ok: true });
}
