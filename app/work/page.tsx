"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { deleteDraft } from "@/lib/draftStorage";
import { projects, type Project } from "@/lib/projects";
import { useDrafts } from "@/lib/useDrafts";
import { isAdmin } from "@/lib/auth";

const filters = ["All", "Project", "Personal"] as const;

type Row = Project & {
  isDraft: boolean;
  overrides: boolean;
  uploaded: boolean;
  href: string;
};

export default function WorkPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [admin, setAdmin] = useState(false);
  const drafts = useDrafts();

  useEffect(() => {
    setAdmin(isAdmin());
  }, []);

  const rows: Row[] = useMemo(() => {
    const draftSlugs = new Set(drafts.map((d) => d.slug));
    const published: Row[] = projects
      .filter((p) => !draftSlugs.has(p.slug))
      .map((p) => ({
        ...p,
        isDraft: false,
        overrides: false,
        uploaded: false,
        href: `/work/${p.slug}`,
      }));
    const draftRows: Row[] = drafts.map((d) => {
      const {
        updatedAt: _u,
        overrides = false,
        uploaded = false,
        ...rest
      } = d;
      return {
        ...rest,
        isDraft: true,
        overrides,
        uploaded,
        href: overrides
          ? `/work/${rest.slug}`
          : `/work/draft?slug=${rest.slug}`,
      };
    });
    return [...draftRows, ...published];
  }, [drafts]);

  const visible =
    filter === "All" ? rows : rows.filter((r) => r.category === filter);

  function onDeleteDraft(slug: string) {
    if (!confirm("이 글을 삭제할까요?")) return;
    deleteDraft(slug);
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
          <div className="mb-10 flex flex-wrap items-center gap-2">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm transition border ${
                    filter === f
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Admin: write button */}
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

          <ul className="grid gap-6 sm:grid-cols-2">
            {visible.map((r) => (
              <li key={(r.isDraft ? "d:" : "p:") + r.slug} className="relative">
                <Link
                  href={r.href}
                  className="group block h-full rounded-2xl border border-border bg-card hover:border-foreground transition overflow-hidden"
                >
                  {/* Cover image */}
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
                      <div className="absolute top-6 right-6 flex items-center gap-2" style={{ top: r.coverImage ? "calc(56.25% + 1.5rem)" : "1.5rem" }}>
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
                          {r.category}
                        </span>
                      </div>
                    </div>

                    {(r.company || r.startDate || r.endDate) && (
                      <p className="font-mono text-[11px] text-muted mb-2">
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

                    <p className="text-sm leading-relaxed text-muted mb-4">
                      {r.summary || "(요약 없음)"}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <ul className="flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <li
                            key={t}
                            className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-mono"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                      <span className="font-mono text-xs text-muted group-hover:text-foreground transition">
                        →
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Admin edit/delete buttons on drafts */}
                {r.isDraft && admin && (
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    <Link
                      href={`/work/edit?slug=${r.slug}`}
                      className="rounded-md border border-border bg-background w-7 h-7 flex items-center justify-center text-xs hover:border-foreground transition"
                      aria-label="edit"
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onDeleteDraft(r.slug);
                      }}
                      className="rounded-md border border-border bg-background w-7 h-7 flex items-center justify-center text-sm hover:border-foreground transition"
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
            <p className="text-sm text-muted">표시할 글이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
