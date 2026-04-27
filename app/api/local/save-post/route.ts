import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Project } from "@/lib/projects";

const POSTS_FILE = join(process.cwd(), "public/data/posts.json");
const DELETED_FILE = join(process.cwd(), "public/data/deleted.json");

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "로컬 개발 환경에서만 사용 가능합니다." }, { status: 403 });
  }
  try {
    const post: Project = await req.json();
    const posts: Project[] = JSON.parse(readFileSync(POSTS_FILE, "utf-8"));
    const idx = posts.findIndex((p) => p.slug === post.slug);
    if (idx >= 0) posts[idx] = post;
    else posts.push(post);
    writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

    // If a post with the same slug was previously deleted, remove the archive entry —
    // re-uploading effectively restores it.
    if (existsSync(DELETED_FILE)) {
      try {
        const deleted = JSON.parse(readFileSync(DELETED_FILE, "utf-8"));
        if (Array.isArray(deleted)) {
          const next = deleted.filter((d: { slug?: string }) => d?.slug !== post.slug);
          if (next.length !== deleted.length) {
            writeFileSync(DELETED_FILE, JSON.stringify(next, null, 2));
          }
        }
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
