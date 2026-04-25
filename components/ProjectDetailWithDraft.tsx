"use client";

import { useEffect, useState } from "react";
import ProjectDetail from "@/components/ProjectDetail";
import { getDraft } from "@/lib/draftStorage";
import type { Project } from "@/lib/projects";

export default function ProjectDetailWithDraft({
  published,
}: {
  published: Project;
}) {
  const [override, setOverride] = useState<Project | null>(null);

  useEffect(() => {
    const sync = () => {
      const d = getDraft(published.slug);
      if (d && d.overrides) {
        const { updatedAt: _u, overrides: _o, ...rest } = d;
        setOverride(rest);
      } else {
        setOverride(null);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("portfolio-drafts-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("portfolio-drafts-changed", sync);
    };
  }, [published.slug]);

  const project = override ?? published;
  return (
    <ProjectDetail
      project={project}
      draftBadge={!!override}
      editHref={`/work/edit?slug=${project.slug}`}
    />
  );
}
