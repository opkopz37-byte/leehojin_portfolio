"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ProjectDetail from "@/components/ProjectDetail";
import { getDraft } from "@/lib/draftStorage";
import type { Project } from "@/lib/projects";

function DraftView() {
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";
  const [project, setProject] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) {
      setProject(null);
      return;
    }
    const d = getDraft(slug);
    if (!d) {
      setProject(null);
      return;
    }
    const { updatedAt: _u, overrides: _o, ...rest } = d;
    setProject(rest);
  }, [slug]);

  if (project === undefined) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="font-mono text-xs text-muted">loading…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="text-sm text-muted">
          드래프트 <code className="font-mono">{slug}</code>을(를) 찾지 못했습니다.
          이 페이지는 글을 저장한 같은 브라우저에서만 열 수 있어요.
        </p>
        <Link
          href="/work"
          className="mt-4 inline-block font-mono text-xs text-muted hover:text-foreground"
        >
          ← Work
        </Link>
      </div>
    );
  }

  return (
    <ProjectDetail
      project={project}
      draftBadge
      editHref={`/work/edit?slug=${project.slug}`}
    />
  );
}

export default function DraftViewPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
          <p className="font-mono text-xs text-muted">loading…</p>
        </div>
      }
    >
      <DraftView />
    </Suspense>
  );
}
