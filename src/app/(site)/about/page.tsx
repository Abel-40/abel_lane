import type { Metadata } from "next";
import { breadcrumbJsonLd, JsonLd, pageMeta, profilePageJsonLd } from "@/lib/seo";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { aboutContent } from "@/content";
import { site } from "@/content/site";
import { AboutHero } from "@/components/about/AboutHero";
import { CareerLog } from "@/components/about/CareerLog";
import { Facts } from "@/components/about/Facts";
import { ToolsBoard } from "@/components/about/ToolsBoard";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon, MarkupIcon } from "@/components/ui/Icon";
import { Rise } from "@/components/ui/Rise";
import "@/styles/about.css";

export const metadata: Metadata = pageMeta({
  path: "/about",
  fullTitle: `About ${site.name} | ${site.role}`,
  description:
    "Abel Addis moved from UI/UX and full-stack work to backend engineering: APIs, async workers, data pipelines, semantic search, RAG and production LLM integrations.",
});

/**
 * Résumé button target from data/site.json › resume: a file in public/ (shown only if it exists), a full https link,
 * or "" to hide the button.
 */
function resumeHref(): string | null {
  const r = site.resume.trim();
  if (/^https:\/\//.test(r)) return r;
  if (r.startsWith("/") && existsSync(join(process.cwd(), "public", r))) return r;
  return null;
}

export default function AboutPage() {
  return (
    <main className="page" data-page="about">
      <JsonLd data={profilePageJsonLd("/about")} />
      <JsonLd data={breadcrumbJsonLd([["About", "/about"]])} />
      <AboutHero resume={resumeHref()} />
      <Facts />
      <CareerLog />
      <ToolsBoard />
      <Rise as="section" className="wrap edu" items=".edu-card" aria-label="Education and certification">
        {aboutContent.education.map((e) => (
          <article className="edu-card" key={e.title}>
            <span className="edu-ico">
              <MarkupIcon name={e.icon} />
            </span>
            <h3>{e.title}</h3>
            <p>{e.org}</p>
            <small>{e.note}</small>
          </article>
        ))}
      </Rise>
      <Rise as="section" className="wrap next-band" items=".next-link">
        <TransitionLink href="/projects" className="next-link">
          <span>
            <small>Next</small>
            <b>See the projects</b>
          </span>
          <Icon name="arrow" />
        </TransitionLink>
      </Rise>
    </main>
  );
}
