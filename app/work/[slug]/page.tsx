import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetailWithDraft from "@/components/ProjectDetailWithDraft";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
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
  const project = getProject(slug);
  if (!project) notFound();
  return <ProjectDetailWithDraft published={project} />;
}
