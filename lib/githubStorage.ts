import type { Project } from "./projects";

const OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "";
const REPO  = process.env.NEXT_PUBLIC_GITHUB_REPO  ?? "";
const TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
const BRANCH = "main";
const FILE_PATH = "public/data/posts.json";

const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

export function isGithubConfigured(): boolean {
  return Boolean(OWNER && REPO && TOKEN);
}

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

async function writeFile(posts: Project[], sha: string, message: string) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API 오류 (${res.status})`);
  }
}

export async function upsertRemotePost(post: Project): Promise<void> {
  if (!isGithubConfigured()) throw new Error("GitHub 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.");
  const { sha, posts } = await getFileMeta();
  const idx = posts.findIndex((p) => p.slug === post.slug);
  if (idx >= 0) posts[idx] = post;
  else posts.push(post);
  await writeFile(posts, sha, `post: ${idx >= 0 ? "update" : "add"} "${post.title}"`);
}

export async function deleteRemotePost(slug: string): Promise<void> {
  if (!isGithubConfigured()) return;
  const { sha, posts } = await getFileMeta();
  const filtered = posts.filter((p) => p.slug !== slug);
  if (filtered.length === posts.length) return;
  await writeFile(filtered, sha, `post: delete "${slug}"`);
}

export async function uploadImage(filename: string, dataUrl: string): Promise<string> {
  if (!isGithubConfigured()) throw new Error("GitHub 환경변수가 설정되지 않았습니다.");
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("이미지 데이터 형식이 잘못되었습니다.");
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
    throw new Error(err.message ?? `GitHub API 오류 (${res.status})`);
  }
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
}
