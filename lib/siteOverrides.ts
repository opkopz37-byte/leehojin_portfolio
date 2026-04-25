"use client";

import { siteConfig } from "./config";

const KEY = "portfolio.site.overrides.v1";

type Overrides = Partial<typeof siteConfig>;

export function getOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

export function setOverride<K extends keyof Overrides>(key: K, value: string): void {
  const o = getOverrides();
  (o as Record<string, string>)[key as string] = value;
  localStorage.setItem(KEY, JSON.stringify(o));
  window.dispatchEvent(new Event("site-overrides-changed"));
}

export function getMergedConfig(): typeof siteConfig {
  return { ...siteConfig, ...getOverrides() };
}
