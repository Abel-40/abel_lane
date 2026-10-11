import type { Metadata } from "next";
import { projects } from "@/content";
import { JsonLd, pageMeta, projectListJsonLd } from "@/lib/seo";
import { ProjectsView } from "@/components/projects/ProjectsView";
import "@/styles/projects.css";

export const metadata: Metadata = pageMeta({
  path: "/projects",
  title: "Projects",
  description:
    "Five products, each built around a real problem: Insight Stream, MoodVerse, SEO Maker, AlertChain and Workroom. AI retrieval, async pipelines and full-stack systems.",
});

export default function ProjectsPage() {
  return (
    <>
      <JsonLd data={projectListJsonLd(projects)} />
      <ProjectsView />
    </>
  );
}
