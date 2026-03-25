import { NextResponse } from "next/server";
import { writeFileSync, copyFileSync, existsSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const dbPath = process.env.DB_PATH?.replace("~", homedir())
    ?? resolve(homedir(), ".devforge", "devforge.db");

  const backupPath = dbPath + ".backup-" + Date.now();

  try {
    // Backup current DB if it exists
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, backupPath);
    }

    // Write new DB
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(dbPath, buffer);

    return NextResponse.json({ success: true, backup: backupPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 });
  }
}
