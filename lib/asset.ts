const basePath =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_BASE_PATH ?? ""
    : "";

export function asset(path: string): string {
  if (!path || /^(https?:|data:)/.test(path)) return path;
  if (!path.startsWith("/")) return `${basePath}/${path}`;
  return `${basePath}${path}`;
}

/** Rewrite root-relative asset URLs in HTML so they honor the deploy basePath.
 *  `<base href>` cannot fix root-relative paths, so we patch them here.
 *  Skips data: URLs and absolute URLs. Idempotent — won't double-prefix. */
export function rewriteHtmlAssetPaths(html: string): string {
  if (!basePath || !html) return html;
  return html.replace(
    /(\b(?:src|href)\s*=\s*["'])(\/(?:images|videos|data)\/)/gi,
    (m, attr: string, p: string) => {
      // Don't double-prefix if basePath already present
      if (m.includes(`${attr}${basePath}/`)) return m;
      return `${attr}${basePath}${p}`;
    },
  );
}
