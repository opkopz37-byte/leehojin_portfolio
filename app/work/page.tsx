"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { deleteDraft } from "@/lib/draftStorage";
import { deleteRemotePost } from "@/lib/githubStorage";
import { projects, SUB_CATEGORIES, type SubCategory, type Project } from "@/lib/projects";
import { useDrafts } from "@/lib/useDrafts";
import { useAdmin } from "@/hooks/useAdmin";

const MAIN_FILTERS = ["All", "Project", "Personal"] as const;
type MainFilter = (typeof MAIN_FILTERS)[number];

type Row = Project & {
  isDraft: boolean;
  overrides: boolean;
  uploaded: boolean;
  href: string;
};

export default function WorkPage() {
  const [main, setMain] = useState<MainFilter>("All");
  const [sub, setSub] = useState<SubCategory | "All">("All");
  const admin = useAdmin();
  const drafts = useDrafts();

  const rows: Row[] = useMemo(() => {
    const draftSlugs = new Set(drafts.map((d) => d.slug));
    const published: Row[] = projects
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
  }, [drafts]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      const matchMain = main === "All" || r.category === main;
      const matchSub = sub === "All" || r.subCategory === sub;
      return matchMain && matchSub;
    });
  }, [rows, main, sub]);

  function onDeleteDraft(slug: string) {
    if (!confirm("이 글을 삭제할까요?")) return;
    deleteDraft(slug);
    deleteRemotePost(slug).catch(() => {});
  }

  return (
    <>
      <PageHeader
        number="02"
        label="Work"
        title="Selected Work"
        description="셰이더, 파이프라인, R&D 작업을 한자리에 모았습니다."
      />

      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">

          {/* Filters row */}
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Main category */}
              <div className="flex flex-wrap gap-2">
                {MAIN_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMain(f)}
                    className={`rounded-full px-4 py-1.5 text-sm transition border ${
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSub("All")}
                className={`rounded-full px-3 py-1 text-xs font-mono transition border ${
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
                  className={`rounded-full px-3 py-1 text-xs font-mono transition border ${
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
          <ul className="grid gap-6 sm:grid-cols-2">
            {visible.map((r) => (
              <li key={(r.isDraft ? "d:" : "p:") + r.slug} className="relative">
                <Link
                  href={r.href}
                  className="group block h-full rounded-2xl border border-border bg-card hover:border-foreground transition overflow-hidden"
                >
                  {r.coverImage && (
                    <div className="aspect-video overflow-hidden bg-card/50">
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold leading-tight pr-14">
                        {r.title || "(제목 없음)"}
                      </h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
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
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {r.subCategory ?? r.category}
                        </span>
                      </div>
                    </div>

                    {(r.projectName || r.subTitle || r.company || r.startDate || r.endDate) && (
                      <p className="font-mono text-[11px] text-muted mb-2">
                        {[
                          r.projectName,
                          r.subTitle,
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

                    <p className="text-sm leading-relaxed text-muted mb-4">
                      {r.summary || "(요약 없음)"}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <ul className="flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <li key={t} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-mono">
                            {t}
                          </li>
                        ))}
                      </ul>
                      <span className="font-mono text-xs text-muted group-hover:text-foreground transition">→</span>
                    </div>
                  </div>
                </Link>

                {/* Admin edit/delete — show on ALL posts */}
                {admin && (
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    <Link
                      href={`/work/edit?slug=${r.slug}`}
                      className="rounded-md border border-border bg-card w-7 h-7 flex items-center justify-center text-xs hover:border-foreground hover:bg-card transition"
                      aria-label="edit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ✎
                    </Link>
                    {r.isDraft && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onDeleteDraft(r.slug); }}
                        className="rounded-md border border-border bg-card w-7 h-7 flex items-center justify-center text-sm hover:border-foreground transition"
                        aria-label="delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {visible.length === 0 && (
            <p className="text-sm text-muted py-12 text-center">표시할 글이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
