import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
  title: "About",
  description:
    "Abel Addis moved from UI/UX and full-stack work to backend engineering: APIs, async workers, data pipelines, semantic search, RAG and production LLM integrations.",
});

/** Résumé is served from public/resume.pdf when it exists; otherwise the button is hidden (TODO-ABEL.md). */
const hasResume = existsSync(join(process.cwd(), "public", "resume.pdf"));

export default function AboutPage() {
  return (
    <main className="page" data-page="about">
      <AboutHero hasResume={hasResume} />
      <Facts />
      <CareerLog />
      <ToolsBoard />
      <Rise as="section" className="wrap edu" items=".edu-card" aria-label="Education and certification">
        <article className="edu-card">
          <span className="edu-ico">
            <MarkupIcon name="grad" />
          </span>
          <h3>BSc in Software Engineering</h3>
          <p>Arba Minch University</p>
          <small>Graduated June 2026</small>
        </article>
        <article className="edu-card">
          <span className="edu-ico">
            <MarkupIcon name="badge" />
          </span>
          <h3>AWS Certified Cloud Practitioner</h3>
          <p>Amazon Web Services</p>
          <small>Certification</small>
        </article>
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
