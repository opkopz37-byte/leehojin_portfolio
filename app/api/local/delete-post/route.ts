import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Project } from "@/lib/projects";

const POSTS_FILE = join(process.cwd(), "public/data/posts.json");
const DELETED_FILE = join(process.cwd(), "public/data/deleted.json");

type DeletedRecord = Project & { deletedAt: string };

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
    return NextResponse.json({ error: "로컬 개발 환경에서만 사용 가능합니다." }, { status: 403 });
  }
  try {
    const { slug }: { slug: string } = await req.json();
    const posts: Project[] = JSON.parse(readFileSync(POSTS_FILE, "utf-8"));
    const target = posts.find((p) => p.slug === slug);
    const filtered = posts.filter((p) => p.slug !== slug);
    writeFileSync(POSTS_FILE, JSON.stringify(filtered, null, 2));

    if (target) {
      const deleted = readDeleted().filter((d) => d.slug !== slug);
      deleted.push({ ...target, deletedAt: new Date().toISOString() });
      writeFileSync(DELETED_FILE, JSON.stringify(deleted, null, 2));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
