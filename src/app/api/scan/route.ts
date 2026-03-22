import { NextResponse } from "next/server";
import { seedFromScan } from "@/db/seed";

export async function POST() {
  const result = await seedFromScan();
  return NextResponse.json(result);
}
