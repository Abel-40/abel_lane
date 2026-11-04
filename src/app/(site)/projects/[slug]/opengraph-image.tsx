import { projectBySlug, projects } from "@/content";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Project by Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug)!;
  return renderOg({ path: `/projects/${p.slug}`, title: p.name, sub: p.tagline });
}
