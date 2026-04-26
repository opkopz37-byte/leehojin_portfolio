import type { Project } from "./projects";

export async function upsertRemotePost(post: Project): Promise<void> {
  const res = await fetch("/api/local/save-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `저장 실패 (${res.status})`);
  }
}

export async function deleteRemotePost(slug: string): Promise<void> {
  const res = await fetch("/api/local/delete-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `삭제 실패 (${res.status})`);
  }
}

export async function uploadImage(filename: string, dataUrl: string): Promise<string> {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("이미지 데이터 형식이 잘못되었습니다.");
  const res = await fetch("/api/local/upload-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, base64 }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `업로드 실패 (${res.status})`);
  }
  const data = await res.json() as { url: string };
  return data.url;
}
