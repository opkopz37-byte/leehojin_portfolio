"use client";

import Link from "next/link";
import MarkdownView from "@/components/MarkdownView";
import { MediaGallery } from "@/components/Media";
import { formatProjectDate, type Project } from "@/lib/projects";
import { useAdmin } from "@/hooks/useAdmin";

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

  return (
    <article>
      <header className="px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="mx-auto max-w-5xl">
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
              {project.category}
              {project.company ? ` · ${project.company}` : ""}
              {projectDate ? ` · ${projectDate}` : ""}
            </p>
            {draftBadge && (
              <span className="rounded-full bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                Draft
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            {project.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            {project.summary}
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-4 border-t border-border pt-8">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Role
              </dt>
              <dd className="mt-1 text-sm">{project.role || "—"}</dd>
            </div>
            {project.category === "Project" && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Company
                </dt>
                <dd className="mt-1 text-sm">{project.company || "—"}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Project date
              </dt>
              <dd className="mt-1 text-sm">{projectDate || "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Stack
              </dt>
              <dd className="mt-1 text-sm">
                {project.tags.length ? project.tags.join(" · ") : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="border-t border-border px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-mono text-xs text-muted mb-6">MEDIA</h2>
          <MediaGallery items={project.media} />
        </div>
      </section>

      <section className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl grid gap-12 md:grid-cols-[180px_1fr]">
          <h2 className="font-mono text-xs text-muted">CASE STUDY</h2>
          <MarkdownView source={project.body} />
        </div>
      </section>

      {project.links && project.links.length > 0 && (
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-5xl">
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
