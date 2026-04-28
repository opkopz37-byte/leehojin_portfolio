import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-static";

const DELETED_FILE = join(process.cwd(), "public/data/deleted.json");

export async function GET() {
  if (!existsSync(DELETED_FILE)) return NextResponse.json([]);
  try {
    const data = JSON.parse(readFileSync(DELETED_FILE, "utf-8"));
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
