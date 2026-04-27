"use client";

import { siteConfig } from "./config";
import { loadConfigValue, saveConfigValue } from "./configStorage";

const KEY = "portfolio.site.overrides.v1";

type Overrides = Partial<typeof siteConfig>;

export function getOverrides(): Overrides {
  return loadConfigValue<Overrides>(KEY, {});
}

export function setOverride<K extends keyof Overrides>(key: K, value: string): void {
  const o = getOverrides();
  (o as Record<string, string>)[key as string] = value;
  saveConfigValue(KEY, o);
  window.dispatchEvent(new Event("site-overrides-changed"));
}

export function getMergedConfig(): typeof siteConfig {
  return { ...siteConfig, ...getOverrides() };
}
