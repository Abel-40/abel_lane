import { CaseBand } from "@/components/home/CaseBand";
import { Cta } from "@/components/home/Cta";
import { Experience } from "@/components/home/experience/Experience";
import { Hero } from "@/components/home/hero/Hero";
import { Journey } from "@/components/home/journey/Journey";
import { Marquee } from "@/components/home/Marquee";
import { Principles } from "@/components/home/Principles";
import { Statement } from "@/components/home/Statement";
import { WorkRail } from "@/components/home/WorkRail";
import "@/styles/home.css";

export default function Home() {
  return (
    <main className="page" data-page="home">
      <Hero />
      <Marquee />
      <Statement />
      <Journey />
      <WorkRail />
      <Experience />
      <Principles />
      <CaseBand />
      <Cta />
    </main>
  );
}
