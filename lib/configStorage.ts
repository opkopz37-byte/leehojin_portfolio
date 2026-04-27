"use client";

import configJson from "../public/data/config.json";

const _file = configJson as Record<string, unknown>;

/** Read a value: localStorage first, then config.json, then code default */
export function loadConfigValue<T>(key: string, defaultValue: T): T {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(key);
      if (local !== null) return JSON.parse(local) as T;
    } catch {}
  }
  if (_file[key] !== undefined) return _file[key] as T;
  return defaultValue;
}

/** Save to localStorage + persist to config.json file (dev mode) */
export function saveConfigValue(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch {}

  if (process.env.NODE_ENV === "development") {
    fetch("/api/local/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
  }
}

/** Sync ALL known localStorage keys to config.json at once (migration / manual sync) */
export async function syncAllToFile(): Promise<void> {
  if (typeof window === "undefined") return;
  const keys = [
    "portfolio.site.overrides.v1",
    "portfolio.header.about",
    "portfolio.header.work",
    "portfolio.header.resume",
    "portfolio.header.contact",
    "portfolio.explore.heading",
    "portfolio.explore.about",
    "portfolio.explore.work",
    "portfolio.explore.resume",
    "portfolio.explore.contact",
    "portfolio.resume.experience",
    "portfolio.resume.education",
    "portfolio.resume.awards",
    "portfolio.resume.military",
    "portfolio.resume.training",
    "portfolio.about.expertise",
    "portfolio.about.stack",
  ];

  const bulk: Record<string, unknown> = {};
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) bulk[key] = JSON.parse(raw);
    } catch {}
  }

  if (Object.keys(bulk).length === 0) return;

  await fetch("/api/local/save-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bulk }),
  });
}
