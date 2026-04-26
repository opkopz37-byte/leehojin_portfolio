"use client";

import type { Project } from "./projects";

const KEY = "portfolio.work.drafts.v1";

export type Draft = Project & {
  /** ISO timestamp of last save */
  updatedAt: string;
  /** True if this draft is intended to override a published project of the same slug */
  overrides?: boolean;
  /** True once the user clicked "업로드" — the post is shown in /work without a Draft badge. */
  uploaded?: boolean;
};

function read(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Draft[]) : [];
  } catch {
    return [];
  }
}

function write(drafts: Draft[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(drafts));
  window.dispatchEvent(new Event("portfolio-drafts-changed"));
}

export function listDrafts(): Draft[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraft(slug: string): Draft | undefined {
  return read().find((d) => d.slug === slug);
}

export function saveDraft(draft: Omit<Draft, "updatedAt">): Draft {
  const drafts = read();
  const updated: Draft = { ...draft, updatedAt: new Date().toISOString() };
  const idx = drafts.findIndex((d) => d.slug === draft.slug);
  if (idx >= 0) drafts[idx] = updated;
  else drafts.push(updated);
  write(drafts);
  return updated;
}

export function deleteDraft(slug: string): void {
  write(read().filter((d) => d.slug !== slug));
}

export const DELETED_SLUGS_KEY = "portfolio.work.deleted";

export function markDeleted(slug: string): void {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(DELETED_SLUGS_KEY) ?? "[]");
    const next = [...new Set([...existing, slug])];
    localStorage.setItem(DELETED_SLUGS_KEY, JSON.stringify(next));
  } catch {}
}

export function exportDraftsJSON(): string {
  return JSON.stringify(read(), null, 2);
}

export function downloadDraftsJSON(): void {
  const blob = new Blob([exportDraftsJSON()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `work-drafts-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadDraftAsProject(slug: string): void {
  const d = getDraft(slug);
  if (!d) return;
  const { updatedAt: _u, overrides: _o, uploaded: _up, ...project } = d;
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
