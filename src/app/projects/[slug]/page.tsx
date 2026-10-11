import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectBySlug, projects } from "@/content";
import { ProjectPage } from "@/components/projects/ProjectPage";
import { breadcrumbJsonLd, JsonLd, pageMeta, projectJsonLd } from "@/lib/seo";
import "@/styles/projects.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  if (!p) return {};
  return pageMeta({ path: `/projects/${p.slug}`, title: p.name, description: `${p.name}: ${p.tagline}. ${p.meet}`, type: "article" });
}

export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  return (
    <>
      <JsonLd data={projectJsonLd(p)} />
      <JsonLd data={breadcrumbJsonLd([["Projects", "/projects"], [p.name, `/projects/${p.slug}`]])} />
      <ProjectPage slug={slug} />
    </>
  );
}
