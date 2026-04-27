"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { deleteDraft } from "@/lib/draftStorage";
import { deleteRemotePost, upsertRemotePost } from "@/lib/githubStorage";
import { projects, staticPlaceholders, SUB_CATEGORIES, type SubCategory, type Project } from "@/lib/projects";
import deletedJson from "../../public/data/deleted.json";
import { useDrafts } from "@/lib/useDrafts";
import { useAdmin } from "@/hooks/useAdmin";

type DeletedRecord = Project & { deletedAt: string };
const _staticDeleted = deletedJson as unknown as DeletedRecord[];

const LEGACY_DELETED_KEY = "portfolio.work.deleted";

const MAIN_FILTERS = ["All", "Project", "Personal"] as const;
type MainFilter = (typeof MAIN_FILTERS)[number];

type Row = Project & {
  isDraft: boolean;
  overrides: boolean;
  uploaded: boolean;
  href: string;
};

/** Combine freshly read posts.json with the built-in placeholders so dev shows
 *  the same set of projects that will be rendered in production once posts.json
 *  is published. We deliberately do NOT merge with the compile-time `projects`
 *  array, which holds a stale snapshot of posts.json and would resurrect just-
 *  deleted posts. */
function mergeProjects(fresh: Project[], placeholders: Project[]): Project[] {
  const freshSlugs = new Set(fresh.map((p) => p.slug));
  return [...fresh, ...placeholders.filter((p) => !freshSlugs.has(p.slug))];
}

export default function WorkPage() {
  const [main, setMain] = useState<MainFilter>("All");
  const [sub, setSub] = useState<SubCategory | "All">("All");
  const [freshProjects, setFreshProjects] = useState<Project[] | null>(null);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>(_staticDeleted);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const admin = useAdmin();
  const drafts = useDrafts();

  // One-time cleanup: visibility is now driven entirely by posts.json,
  // so the legacy localStorage filter is removed.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_DELETED_KEY);
    } catch {}
  }, []);

  // In dev mode, always fetch fresh posts from the file on mount
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    fetch("/api/local/posts")
      .then((r) => r.json())
      .then((data: Project[]) => setFreshProjects(data))
      .catch(() => {});
    fetch("/api/local/deleted")
      .then((r) => r.json())
      .then((data: DeletedRecord[]) => setDeletedRecords(data))
      .catch(() => {});
  }, []);

  const baseProjects = freshProjects !== null
    ? mergeProjects(freshProjects, staticPlaceholders)
    : projects;

  const rows: Row[] = useMemo(() => {
    const draftSlugs = new Set(drafts.map((d) => d.slug));
    const published: Row[] = baseProjects
      .filter((p) => !draftSlugs.has(p.slug))
      .map((p) => ({ ...p, isDraft: false, overrides: false, uploaded: false, href: `/work/${p.slug}` }));
    const draftRows: Row[] = drafts.map((d) => {
      const { updatedAt: _u, overrides = false, uploaded = false, ...rest } = d;
      return {
        ...rest,
        isDraft: true,
        overrides,
        uploaded,
        href: overrides ? `/work/${rest.slug}` : `/work/draft?slug=${rest.slug}`,
      };
    });
    return [...draftRows, ...published];
  }, [drafts, baseProjects]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      const matchMain = main === "All" || r.category === main;
      const matchSub = sub === "All" || r.subCategory === sub;
      return matchMain && matchSub;
    });
  }, [rows, main, sub]);

  const onDelete = useCallback(async (slug: string, _isDraft: boolean) => {
    if (!confirm("이 글을 삭제할까요?")) return;
    deleteDraft(slug);
    try {
      await deleteRemotePost(slug);
    } catch (err) {
      alert(`삭제 실패: ${err instanceof Error ? err.message : "오류"}`);
      return;
    }
    if (process.env.NODE_ENV === "development") {
      fetch("/api/local/posts")
        .then((r) => r.json())
        .then((data: Project[]) => setFreshProjects(data))
        .catch(() => {});
      fetch("/api/local/deleted")
        .then((r) => r.json())
        .then((data: DeletedRecord[]) => setDeletedRecords(data))
        .catch(() => {});
    }
  }, []);

  const onRestore = useCallback(async (record: DeletedRecord) => {
    if (!confirm(`"${record.title || record.slug}" 글을 복원할까요?`)) return;
    const { deletedAt: _del, ...project } = record;
    try {
      await upsertRemotePost(project as Project);
    } catch (err) {
      alert(`복원 실패: ${err instanceof Error ? err.message : "오류"}`);
      return;
    }
    if (process.env.NODE_ENV === "development") {
      fetch("/api/local/posts")
        .then((r) => r.json())
        .then((data: Project[]) => setFreshProjects(data))
        .catch(() => {});
      fetch("/api/local/deleted")
        .then((r) => r.json())
        .then((data: DeletedRecord[]) => setDeletedRecords(data))
        .catch(() => {});
    } else {
      setDeletedRecords((prev) => prev.filter((d) => d.slug !== record.slug));
    }
  }, []);

  return (
    <>
      <PageHeader
        number="02"
        label="Work"
        title="Selected Work"
        description="셰이더, 파이프라인, R&D 작업을 한자리에 모았습니다."
      />

      <section className="border-t border-border px-4 sm:px-6 py-8 sm:py-16">
        <div className="mx-auto max-w-5xl">

          {/* Filters row */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Main category */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {MAIN_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMain(f)}
                    className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm transition border ${
                      main === f
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Admin write button */}
              {admin && (
                <div className="ml-auto">
                  <Link
                    href="/work/new"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition"
                  >
                    + 글쓰기
                  </Link>
                </div>
              )}
            </div>

            {/* Sub-category filter */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSub("All")}
                className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono transition border ${
                  sub === "All"
                    ? "bg-accent/10 text-accent border-accent/40"
                    : "border-border text-muted hover:text-foreground hover:border-foreground"
                }`}
              >
                All
              </button>
              {SUB_CATEGORIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSub(s)}
                  className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono transition border ${
                    sub === s
                      ? "bg-accent/10 text-accent border-accent/40"
                      : "border-border text-muted hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <ul className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2">
            {visible.map((r) => (
              <li key={(r.isDraft ? "d:" : "p:") + r.slug} className="relative">
                <Link
                  href={r.href}
                  className="group block h-full rounded-xl sm:rounded-2xl border border-border bg-card hover:border-foreground transition overflow-hidden"
                >
                  {r.coverImage && (
                    <div className="relative aspect-video overflow-hidden bg-card/50">
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider bg-black/50 text-white backdrop-blur-sm">
                        {r.category}
                      </span>
                    </div>
                  )}

                  <div className="p-3 sm:p-6">
                    {!r.coverImage && (
                      <span className="inline-block mb-2 sm:mb-3 rounded px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider border border-border text-muted">
                        {r.category}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-lg font-semibold leading-tight">
                        {r.title || "(제목 없음)"}
                      </h3>
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        {r.isDraft && !r.uploaded && (
                          <span className="rounded-full bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                            {r.overrides ? "Draft override" : "Draft"}
                          </span>
                        )}
                        {r.isDraft && r.uploaded && (
                          <span className="rounded-full bg-foreground/5 text-muted border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                            Local
                          </span>
                        )}
                        {r.subCategory && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                            {r.subCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {(r.company || r.startDate || r.endDate) && (
                      <p className="hidden sm:block font-mono text-[11px] text-muted mb-2">
                        {[
                          r.company,
                          (r.startDate?.slice(0, 4) || r.endDate?.slice(0, 4)) &&
                            [r.startDate?.slice(0, 4), r.endDate?.slice(0, 4)]
                              .filter(Boolean)
                              .join(r.startDate && r.endDate ? "–" : ""),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}

                    <p className="hidden sm:block text-sm leading-relaxed text-muted mb-4">
                      {r.summary || "(요약 없음)"}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <ul className="flex flex-wrap gap-1">
                        {r.tags.slice(0, 2).map((t) => (
                          <li key={t} className="rounded-full bg-background border border-border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono">
                            {t}
                          </li>
                        ))}
                        {r.tags.length > 2 && (
                          <li className="sm:hidden rounded-full bg-background border border-border px-1.5 py-0.5 text-[9px] font-mono text-muted">
                            +{r.tags.length - 2}
                          </li>
                        )}
                        {r.tags.slice(2).map((t) => (
                          <li key={t} className="hidden sm:list-item rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-mono">
                            {t}
                          </li>
                        ))}
                      </ul>
                      <span className="font-mono text-xs text-muted group-hover:text-foreground transition shrink-0">→</span>
                    </div>
                  </div>
                </Link>

                {/* Admin edit/delete */}
                {admin && (
                  <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex gap-1">
                    <Link
                      href={`/work/edit?slug=${r.slug}`}
                      className="rounded-md border border-border bg-card w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs hover:border-foreground transition"
                      aria-label="edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onDelete(r.slug, r.isDraft); }}
                      className="rounded-md border border-red-500/40 bg-card w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-sm text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
                      aria-label="delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {visible.length === 0 && (
            <p className="text-sm text-muted py-12 text-center">표시할 글이 없습니다.</p>
          )}

          {admin && deletedRecords.length > 0 && (
            <div className="mt-12 border-t border-border pt-6">
              <button
                type="button"
                onClick={() => setArchiveOpen((v) => !v)}
                className="flex items-center gap-2 font-mono text-xs text-muted hover:text-foreground transition"
              >
                <span>🗑 휴지통</span>
                <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px]">
                  {deletedRecords.length}
                </span>
                <span className="text-[10px]">{archiveOpen ? "▾" : "▸"}</span>
              </button>

              {archiveOpen && (
                <ul className="mt-4 grid gap-2">
                  {[...deletedRecords]
                    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
                    .map((d) => (
                      <li
                        key={d.slug + d.deletedAt}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {d.title || `(제목 없음 — ${d.slug})`}
                          </p>
                          <p className="font-mono text-[10px] text-muted">
                            {d.slug} · 삭제 {d.deletedAt.slice(0, 10)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRestore(d)}
                          className="rounded-full border border-accent/40 px-3 py-1 text-xs font-mono text-accent hover:bg-accent/10 transition"
                        >
                          복원
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
