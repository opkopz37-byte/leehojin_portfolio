import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_FILE = join(process.cwd(), "public/data/config.json");

function readConfig(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { key?: string; value?: unknown; bulk?: Record<string, unknown> };
    const current = readConfig();

    if (body.bulk) {
      // Bulk update: merge all keys
      const merged = { ...current, ...body.bulk };
      writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
    } else if (body.key !== undefined) {
      // Single key update
      current[body.key] = body.value;
      writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
