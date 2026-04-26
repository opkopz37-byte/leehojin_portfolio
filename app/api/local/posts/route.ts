import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const POSTS_FILE = join(process.cwd(), "public/data/posts.json");

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(POSTS_FILE, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
