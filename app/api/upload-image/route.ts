import { NextRequest, NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER ?? "";
const REPO = process.env.GITHUB_REPO ?? "";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const BRANCH = "main";

export async function POST(req: NextRequest) {
  if (!OWNER || !REPO || !TOKEN) {
    return NextResponse.json({ error: "GitHub 환경변수 미설정" }, { status: 500 });
  }
  try {
    const { filename, base64 }: { filename: string; base64: string } = await req.json();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadName = `${Date.now()}-${safeName}`;
    const filePath = `public/images/${uploadName}`;
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: `image: upload ${uploadName}`, content: base64, branch: BRANCH }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({ error: err.message ?? "GitHub 오류" }, { status: 500 });
    }
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
