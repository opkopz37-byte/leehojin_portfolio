import configJson from "../public/data/config.json";
import { siteConfig } from "./config";

const _file = configJson as Record<string, unknown>;

function extractStrings(value: unknown, depth = 0): string[] {
  if (depth > 8 || value == null) return [];
  if (typeof value === "string") {
    const t = value.trim();
    return t ? [t] : [];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v) => extractStrings(v, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((v) =>
      extractStrings(v, depth + 1),
    );
  }
  return [];
}

/** Build a plain-text snapshot of every config-driven block on the site so
 *  crawlers/AI reading the static HTML can understand the actual content
 *  (footer, hero, about, resume, headers, explore, etc.). Server-side only —
 *  reads the build-time copy of config.json plus siteConfig overrides. */
export function buildSiteSnapshot(): string[] {
  const overrides = (_file["portfolio.site.overrides.v1"] ?? {}) as Partial<
    typeof siteConfig
  >;
  const site = { ...siteConfig, ...overrides };
  const sections: string[][] = [];

  sections.push(extractStrings(site));

  for (const [key, value] of Object.entries(_file)) {
    if (key === "portfolio.site.overrides.v1") continue;
    const strs = extractStrings(value);
    if (strs.length) sections.push(strs);
  }

  return sections
    .map((s) => s.join("\n").trim())
    .filter(Boolean);
}
