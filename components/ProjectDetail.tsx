"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import BodyView from "@/components/BodyView";
import { MediaGallery } from "@/components/Media";
import PostToc, { type TocHeading } from "@/components/PostToc";
import ReadingProgress from "@/components/ReadingProgress";
import { formatProjectDate, type Project } from "@/lib/projects";
import { useAdmin } from "@/hooks/useAdmin";

function isHtmlBody(project: Project): boolean {
  if (project.bodyFormat === "html") return true;
  if (project.bodyFormat === "markdown") return false;
  const head = (project.body ?? "").trimStart().slice(0, 200).toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

export default function ProjectDetail({
  project,
  draftBadge,
  editHref,
}: {
  project: Project;
  draftBadge?: boolean;
  editHref?: string;
}) {
  const projectDate = formatProjectDate(project.startDate, project.endDate);
  const admin = useAdmin();
  const resolvedEditHref = editHref ?? (admin ? `/work/edit?slug=${project.slug}` : undefined);
  const htmlBody = isHtmlBody(project);

  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const headingsRef = useRef<TocHeading[]>([]);
  const didInitialJumpRef = useRef(false);
  const pendingScrollRef = useRef<{ id: string; smooth: boolean } | null>(null);

  useEffect(() => {
    headingsRef.current = headings;
  }, [headings]);

  const performScroll = useCallback(
    (top: number, smooth: boolean) => {
      const frame = iframeRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const target = rect.top + window.scrollY + top - 96;
      window.scrollTo({
        top: Math.max(0, target),
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [],
  );

  const scrollToHeading = useCallback(
    (id: string) => {
      const frame = iframeRef.current;
      if (!frame) return;
      const heading = headingsRef.current.find((h) => h.id === id);
      pendingScrollRef.current = { id, smooth: true };
      // 1) 즉시 저장된 위치로 스크롤 (응답 없어도 작동)
      if (heading) performScroll(heading.top, true);
      // 2) iframe에 라이브 위치 요청 — 응답 도착 시 보정
      frame.contentWindow?.postMessage({ type: "toc-query", id }, "*");
      if (typeof history !== "undefined") {
        history.replaceState(null, "", `#${id}`);
      }
    },
    [performScroll],
  );

  const onTocPosition = useCallback(
    (id: string, top: number | null) => {
      const pending = pendingScrollRef.current;
      if (!pending || pending.id !== id) return;
      pendingScrollRef.current = null;
      if (top == null) return;
      performScroll(top, pending.smooth);
    },
    [performScroll],
  );

  useEffect(() => {
    if (!htmlBody) return;
    if (headings.length > 0) return;
    let attempts = 0;
    const interval = window.setInterval(() => {
      if (attempts++ >= 20) {
        window.clearInterval(interval);
        return;
      }
      iframeRef.current?.contentWindow?.postMessage(
        { type: "toc-refresh" },
        "*",
      );
    }, 300);
    return () => window.clearInterval(interval);
  }, [htmlBody, headings.length]);

  useEffect(() => {
    if (!htmlBody) return;
    if (didInitialJumpRef.current) return;
    if (headings.length === 0) return;
    if (typeof window === "undefined") return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const heading = headings.find((h) => h.id === hash);
    if (!heading) return;
    didInitialJumpRef.current = true;
    const frame = iframeRef.current;
    if (!frame) return;
    pendingScrollRef.current = { id: hash, smooth: false };
    performScroll(heading.top, false);
    frame.contentWindow?.postMessage({ type: "toc-query", id: hash }, "*");
  }, [headings, htmlBody, performScroll]);

  useEffect(() => {
    if (!htmlBody || headings.length === 0) return;
    function onScroll() {
      const frame = iframeRef.current;
      if (!frame) return;
      const doc = document.documentElement;
      const vh = window.innerHeight;
      const scrollable = doc.scrollHeight - vh;
      const nearBottom =
        scrollable > 0 && window.scrollY >= scrollable - 2;
      if (nearBottom) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }
      const rect = frame.getBoundingClientRect();
      const frameTopAbs = rect.top + window.scrollY;
      const probe = window.scrollY + vh * 0.5;
      let bestTop = -Infinity;
      let bestId: string | null = null;
      for (const h of headings) {
        const ht = frameTopAbs + h.top;
        if (ht <= probe && ht > bestTop) {
          bestTop = ht;
          bestId = h.id;
        }
      }
      if (bestId == null) bestId = headings[0]?.id ?? null;
      setActiveId(bestId);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings, htmlBody]);

  return (
    <article>
      {htmlBody && <ReadingProgress />}
      <header className="px-4 sm:px-6 pt-28 pb-8 sm:pt-40 sm:pb-16">
        <div className="mx-auto w-full max-w-none">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link
              href="/work"
              className="font-mono text-xs text-muted hover:text-foreground transition"
            >
              ← All work
            </Link>
            {resolvedEditHref && (
              <Link
                href={resolvedEditHref}
                className="font-mono text-xs text-muted hover:text-foreground transition"
              >
                Edit ✎
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <p className="font-mono text-sm text-accent">
              {[
                project.category,
                project.projectName,
                project.subTitle,
                project.company,
                projectDate,
              ].filter(Boolean).join(" · ")}
            </p>
            {draftBadge && (
              <span className="rounded-full bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                Draft
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            {project.title}
          </h1>
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg leading-relaxed text-muted">
            {project.summary}
          </p>

          <dl className="mt-8 sm:mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 border-t border-border pt-6 sm:pt-8">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Role
              </dt>
              <dd className="mt-1 text-xs sm:text-sm">{project.role || "—"}</dd>
            </div>
            {project.projectName && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Project Name
                </dt>
                <dd className="mt-1 text-xs sm:text-sm">{project.projectName}</dd>
              </div>
            )}
            {project.subTitle && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Sub Title
                </dt>
                <dd className="mt-1 text-xs sm:text-sm">{project.subTitle}</dd>
              </div>
            )}
            {project.company && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Company
                </dt>
                <dd className="mt-1 text-xs sm:text-sm">{project.company}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Project date
              </dt>
              <dd className="mt-1 text-xs sm:text-sm">{projectDate || "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Stack
              </dt>
              <dd className="mt-1 text-xs sm:text-sm leading-relaxed">
                {project.tags.length ? project.tags.join(" · ") : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {(project.videoLinks?.filter(Boolean).length || project.media.length > 0) ? (
        <section className="border-t border-border px-4 sm:px-6 py-12 sm:py-16">
          <div className="mx-auto w-full max-w-none">
            {project.videoLinks && project.videoLinks.filter(Boolean).length > 0 && (
              <div className="space-y-6 mb-8">
                {project.videoLinks.filter(Boolean).map((url) => (
                  <VideoEmbed key={url} url={url} />
                ))}
              </div>
            )}
            {project.media.length > 0 && (
              <>
                <h2 className="font-mono text-xs text-muted mb-6">MEDIA</h2>
                <MediaGallery items={project.media} />
              </>
            )}
          </div>
        </section>
      ) : null}

      {htmlBody ? (
        <section className="block">
          <div className="flex lg:gap-8 px-0 lg:pl-6">
            <PostToc
              headings={headings}
              activeId={activeId}
              onSelect={scrollToHeading}
            />
            <div className="flex-1 min-w-0">
              <BodyView
                source={project.body}
                format={project.bodyFormat}
                className="block w-full"
                onIframeReady={(el) => {
                  iframeRef.current = el;
                }}
                onTocHeadings={(hs) =>
                  setHeadings(hs.filter((h) => h.level === 2))
                }
                onTocPosition={onTocPosition}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="border-t border-border px-4 sm:px-6 py-12 sm:py-24">
          <div className="mx-auto w-full max-w-none grid gap-8 md:grid-cols-[180px_1fr] md:gap-12">
            <h2 className="font-mono text-xs text-muted">CASE STUDY</h2>
            <BodyView source={project.body} format={project.bodyFormat} />
          </div>
        </section>
      )}

      {project.links && project.links.length > 0 && (
        <section className={`px-4 sm:px-6 py-12 ${htmlBody ? "" : "border-t border-border"}`}>
          <div className="mx-auto w-full max-w-none">
            <h2 className="font-mono text-xs text-muted mb-4">LINKS</h2>
            <ul className="flex flex-wrap gap-3">
              {project.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-foreground transition"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

function VideoEmbed({ url }: { url: string }) {
  function youtubeId(u: string) {
    const m = u.match(/(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  }
  function vimeoId(u: string) {
    const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m?.[1] ?? null;
  }
  const yt = youtubeId(url);
  const vm = vimeoId(url);
  const src = yt
    ? `https://www.youtube.com/embed/${yt}`
    : vm
    ? `https://player.vimeo.com/video/${vm}`
    : null;
  if (!src) return null;
  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
