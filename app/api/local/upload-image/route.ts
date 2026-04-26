import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "로컬 개발 환경에서만 사용 가능합니다." }, { status: 403 });
  }
  try {
    const { filename, base64 }: { filename: string; base64: string } = await req.json();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadName = `${Date.now()}-${safeName}`;
    const imagesDir = join(process.cwd(), "public/images");
    if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });
    writeFileSync(join(imagesDir, uploadName), Buffer.from(base64, "base64"));
    return NextResponse.json({ url: `/images/${uploadName}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "오류" }, { status: 500 });
  }
}
