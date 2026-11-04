import { CaseBand } from "@/components/home/CaseBand";
import { Cta } from "@/components/home/Cta";
import { Experience } from "@/components/home/experience/Experience";
import { Hero } from "@/components/home/hero/Hero";
import { Journey } from "@/components/home/journey/Journey";
import { Marquee } from "@/components/home/Marquee";
import { Principles } from "@/components/home/Principles";
import { Statement } from "@/components/home/Statement";
import { WorkRail } from "@/components/home/WorkRail";
import type { Metadata } from "next";
import { Suspense } from "react";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import "@/styles/home.css";

export const metadata: Metadata = pageMeta({ path: "/", description: site.description });

export default function Home() {
  return (
    <main className="page" data-page="home">
      <Hero />
      {/* Suspense boundaries let React hydrate the below-the-fold sections in separate, yieldable tasks. */}
      <Suspense>
        <Marquee />
      </Suspense>
      <Suspense>
        <Statement />
      </Suspense>
      <Suspense>
        <Journey />
      </Suspense>
      <Suspense>
        <WorkRail />
      </Suspense>
      <Suspense>
        <Experience />
      </Suspense>
      <Suspense>
        <Principles />
      </Suspense>
      <Suspense>
        <CaseBand />
      </Suspense>
      <Suspense>
        <Cta />
      </Suspense>
    </main>
  );
}
