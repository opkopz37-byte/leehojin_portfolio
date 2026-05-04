import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DELETED_FILE = join(process.cwd(), "public/data/deleted.json");

type DeletedRecord = { slug: string; deletedAt: string } & Record<string, unknown>;

function readDeleted(): DeletedRecord[] {
  if (!existsSync(DELETED_FILE)) return [];
  try {
    const raw = readFileSync(DELETED_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "로컬 개발 환경에서만 사용 가능합니다." },
      { status: 403 },
    );
  }
  try {
    const body = (await req.json()) as { slug?: string; all?: boolean };
    if (body.all) {
      writeFileSync(DELETED_FILE, "[]\n");
      return NextResponse.json({ ok: true, removed: "all" });
    }
    if (typeof body.slug === "string" && body.slug) {
      const next = readDeleted().filter((d) => d.slug !== body.slug);
      writeFileSync(DELETED_FILE, JSON.stringify(next, null, 2));
      return NextResponse.json({ ok: true, removed: body.slug });
    }
    return NextResponse.json({ error: "slug 또는 all이 필요합니다." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "오류" },
      { status: 500 },
    );
  }
}
