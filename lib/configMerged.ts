import configJson from "../public/data/config.json";
import { siteConfig } from "./config";

const _file = configJson as Record<string, unknown>;
const KEY = "portfolio.site.overrides.v1";

/** Merge of siteConfig + bundled portfolio.site.overrides.v1.
 *  Safe to use as a useState initializer in client components — returns
 *  the same value during SSR and the first client render (no localStorage
 *  read), so no hydration mismatch. After hydration, useEffect can swap to
 *  getMergedConfig() so per-browser localStorage overrides take effect. */
export function getMergedSiteConfigFromFile(): typeof siteConfig {
  const overrides = (_file[KEY] ?? {}) as Partial<typeof siteConfig>;
  return { ...siteConfig, ...overrides };
}
