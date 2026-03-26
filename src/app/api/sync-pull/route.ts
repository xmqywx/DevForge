import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolve } from "path";

export async function POST() {
  try {
    const devforgeDir = resolve(process.cwd());
    const result = execSync(
      `cd ${devforgeDir} && node_modules/.bin/tsx scripts/sync.ts pull`,
      { encoding: "utf-8", timeout: 15000 }
    );
    return NextResponse.json({ success: true, output: result.trim() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
