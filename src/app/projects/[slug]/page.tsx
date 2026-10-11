import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectBySlug, projects } from "@/content";
import { ProjectPage } from "@/components/projects/ProjectPage";
import "@/styles/projects.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  if (!p) return {};
  return { title: p.name, description: `${p.name}: ${p.tagline}. ${p.meet}` };
}

export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  if (!projectBySlug(slug)) notFound();
  return <ProjectPage slug={slug} />;
}
