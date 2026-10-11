import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseBySlug, cases, projectById } from "@/content";
import { CaseReader } from "@/components/cases/CaseReader";
import { CaseSections, tocFor } from "@/components/cases/CaseSections";
import "@/styles/cases.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const c = caseBySlug((await params).slug);
  if (!c) return {};
  return { title: c.title, description: c.q };
}

export default async function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  const c = caseBySlug((await params).slug);
  if (!c) notFound();
  const project = projectById(c.projectId);
  return (
    <CaseReader c={c} project={project} toc={tocFor(c)}>
      <CaseSections c={c} project={project} />
    </CaseReader>
  );
}
