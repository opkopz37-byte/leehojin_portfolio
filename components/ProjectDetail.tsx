"use client";

import Link from "next/link";
import BodyView from "@/components/BodyView";
import { MediaGallery } from "@/components/Media";
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

  return (
    <article>
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
          <BodyView source={project.body} format={project.bodyFormat} className="block w-full" />
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
