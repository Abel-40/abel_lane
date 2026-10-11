import type { Metadata } from "next";
import { CasesView } from "@/components/cases/CasesView";
import "@/styles/cases.css";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "The decisions behind the code: how Abel Addis approaches trustworthy AI retrieval, scalable crawling pipelines, async content intelligence, price alerts and project-level access control.",
};

export default function CaseStudiesPage() {
  return <CasesView />;
}
