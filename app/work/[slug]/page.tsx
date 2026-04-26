import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import ProjectDetailWithDraft from "@/components/ProjectDetailWithDraft";
import { getProject, projects, type Project } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

function getProjectFresh(slug: string): Project | undefined {
  // In dev mode, read posts.json directly so edits are immediately visible
  if (process.env.NODE_ENV === "development") {
    try {
      const all = JSON.parse(
        readFileSync(join(process.cwd(), "public/data/posts.json"), "utf-8")
      ) as Project[];
      const found = all.find((p) => p.slug === slug);
      if (found) return found;
    } catch {}
  }
  return getProject(slug);
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProjectFresh(slug);
  if (!project) return { title: "Not Found" };
  return {
    title: `${project.title} — Work`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage(
  props: PageProps<"/work/[slug]">,
) {
  const { slug } = await props.params;
  const project = getProjectFresh(slug);
  if (!project) notFound();
  return <ProjectDetailWithDraft published={project} />;
}
