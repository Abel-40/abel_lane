import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { CasesView } from "@/components/cases/CasesView";
import "@/styles/cases.css";

export const metadata: Metadata = pageMeta({
  path: "/case-studies",
  title: "Case studies",
  description:
    "The decisions behind the code: trustworthy AI retrieval, scalable crawling pipelines, async content intelligence, price alerts and project-level access control.",
});

export default function CaseStudiesPage() {
  return <CasesView />;
}
