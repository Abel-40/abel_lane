import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseBySlug, cases, projectById } from "@/content";
import { CaseBody } from "@/components/cases/CaseBody";
import { CaseReader } from "@/components/cases/CaseReader";
import { tocFor } from "@/components/cases/toc";
import { pageMeta } from "@/lib/seo";
import "@/styles/cases.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const c = caseBySlug((await params).slug);
  if (!c) return {};
  const meta = pageMeta({ path: `/case-studies/${c.slug}`, title: c.title, description: c.q, type: "article" });
  // the case figure is the share image (file in public/); alt text comes from the figure
  const image = { url: c.figure.src, width: c.figure.width, height: c.figure.height, alt: c.figure.alt };
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [image] },
    twitter: { ...meta.twitter, images: [image.url] },
  };
}

/** Case-study reader. The write-up is the case's `sections` in data/case-studies.json. */
export default async function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  const c = caseBySlug((await params).slug);
  if (!c) notFound();
  return (
    <CaseReader c={c} project={projectById(c.projectId)} toc={tocFor(c)}>
      <CaseBody c={c} />
    </CaseReader>
  );
}
