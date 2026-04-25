"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ProjectForm from "@/components/ProjectForm";
import { getDraft } from "@/lib/draftStorage";
import { getProject, type Project } from "@/lib/projects";
import { isAdmin } from "@/lib/auth";

function EditView() {
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";
  const [state, setState] = useState<{
    initial?: Partial<Project>;
    overrides: boolean;
    uploaded: boolean;
    ready: boolean;
    forbidden: boolean;
  }>({ overrides: false, uploaded: false, ready: false, forbidden: false });

  useEffect(() => {
    if (!isAdmin()) {
      setState((p) => ({ ...p, ready: true, forbidden: true }));
      return;
    }

    if (!slug) {
      setState({ overrides: false, uploaded: false, ready: true, forbidden: false });
      return;
    }
    const draft = getDraft(slug);
    if (draft) {
      const {
        updatedAt: _u,
        overrides = false,
        uploaded = false,
        ...rest
      } = draft;
      setState({ initial: rest, overrides, uploaded, ready: true, forbidden: false });
      return;
    }
    const published = getProject(slug);
    if (published) {
      setState({
        initial: published,
        overrides: true,
        uploaded: false,
        ready: true,
        forbidden: false,
      });
      return;
    }
    setState({ overrides: false, uploaded: false, ready: true, forbidden: false });
  }, [slug]);

  if (state.forbidden) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="text-sm text-muted">관리자 권한이 필요합니다.</p>
        <Link href="/work" className="mt-4 inline-block font-mono text-xs text-muted hover:text-foreground">
          ← Work
        </Link>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="text-sm text-muted">편집할 글의 slug가 없습니다.</p>
        <Link
          href="/work"
          className="mt-4 inline-block font-mono text-xs text-muted hover:text-foreground"
        >
          ← Work
        </Link>
      </div>
    );
  }

  if (!state.ready) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="font-mono text-xs text-muted">loading…</p>
      </div>
    );
  }

  if (!state.initial) {
    return (
      <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
        <p className="text-sm text-muted">
          slug <code className="font-mono">{slug}</code> 에 해당하는 글을 찾지 못했습니다.
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
    <ProjectForm
      mode="edit"
      initial={state.initial}
      originalSlug={slug}
      overrides={state.overrides}
      initialUploaded={state.uploaded}
    />
  );
}

export default function EditWorkPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 pt-40 pb-24 mx-auto max-w-3xl">
          <p className="font-mono text-xs text-muted">loading…</p>
        </div>
      }
    >
      <EditView />
    </Suspense>
  );
}
