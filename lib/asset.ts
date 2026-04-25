const basePath =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    : "";

export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!path.startsWith("/")) return `${basePath}/${path}`;
  return `${basePath}${path}`;
}
