import { NextRequest, NextResponse } from "next/server";
import type { Project } from "@/lib/projects";

const OWNER = process.env.GITHUB_OWNER ?? "";
const REPO = process.env.GITHUB_REPO ?? "";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const BRANCH = "main";
const FILE_PATH = "public/data/posts.json";
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

async function getFileMeta(): Promise<{ sha: string; posts: Project[] }> {
  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  const posts: Project[] = JSON.parse(atob(data.content.replace(/\n/g, "")));
  return { sha: data.sha, posts };
}

export async function POST(req: NextRequest) {
  if (!OWNER || !REPO || !TOKEN) {
    return NextResponse.json({ error: "GitHub 환경변수 미설정" }, { status: 500 });
  }
  try {
    const post: Project = await req.json();
    const { sha, posts } = await getFileMeta();
    const idx = posts.findIndex((p) => p.slug === post.slug);
    if (idx >= 0) posts[idx] = post;
    else posts.push(post);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
    const writeRes = await fetch(API_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `post: ${idx >= 0 ? "update" : "add"} "${post.title}"`,
        content,
        sha,
        branch: BRANCH,
      }),
    });
    if (!writeRes.ok) {
      const err = await writeRes.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({ error: err.message ?? "GitHub 오류" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
