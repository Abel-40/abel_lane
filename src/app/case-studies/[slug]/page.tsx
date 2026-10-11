import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseBySlug, cases, projectById } from "@/content";
import { caseFrontmatter } from "@/content/case-schema";
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
  return pageMeta({ path: `/case-studies/${c.slug}`, title: c.title, description: c.q, type: "article" });
}

/** Case-study reader. The body is src/content/case-studies/<slug>.mdx; its frontmatter is validated here. */
export default async function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) notFound();
  const mod = await import(`@/content/case-studies/${slug}.mdx`);
  const fm = caseFrontmatter.parse(mod.frontmatter); // fails the build on malformed frontmatter
  const Body = mod.default;
  return (
    <CaseReader c={{ ...c, ...fm }} project={projectById(c.projectId)} toc={tocFor({ ...c, ...fm })}>
      <Body />
    </CaseReader>
  );
}
