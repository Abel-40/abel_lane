import { notFound } from "next/navigation";
import { projectBySlug, projects } from "@/content";
import { ProjectOverlay } from "@/components/projects/ProjectOverlay";
import "@/styles/projects.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/** Intercepted soft navigation to /projects/[slug]: the detail opens as an overlay over the current page. */
export default async function InterceptedProject({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  if (!projectBySlug(slug)) notFound();
  return <ProjectOverlay slug={slug} />;
}
