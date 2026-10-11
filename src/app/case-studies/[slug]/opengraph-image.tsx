import { caseBySlug, cases } from "@/content";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Case study by Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = caseBySlug((await params).slug)!;
  return renderOg({ path: `/case-studies/${c.slug}`, title: c.title, sub: `${c.project} · ${c.status}` });
}
