import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";
import "@/styles/projects.css";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Five products, each built around a real problem: Insight Stream, MoodVerse, SEO Maker, AlertChain and Workroom. AI retrieval, async pipelines and full-stack systems.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
