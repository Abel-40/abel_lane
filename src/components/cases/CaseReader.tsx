"use client";

import { useRef, useState } from "react";
import type { CaseStudy, Project } from "@/content/types";
import { splitChars } from "@/lib/anim";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
import { scrollToY } from "@/lib/scroll";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { FlowPills } from "@/components/ui/FlowPills";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

export interface TocItem {
  id: string;
  n: string;
  label: string;
}

/**
 * Case-study reader (reference readerHTML + readerAnims): back link, meta, split title, the engineering
 * question, the project's system flow, then a sticky table of contents with scroll-spy beside the body.
 */
export function CaseReader({
  c,
  project,
  toc,
  children,
}: {
  c: CaseStudy;
  project: Project;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(toc[0]?.id);

  useIntroGSAP(
    () => {
      let startIntro: ((covered: boolean) => void) | null = null;
      const el = root.current!;
      // scroll-spy runs with or without motion
      el.querySelectorAll<HTMLElement>(".rd-sec").forEach((s) => {
        ScrollTrigger.create({
          trigger: s,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => self.isActive && setActive(s.id),
        });
      });
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ paused: true, delay: 0.1 })
          .from(el.querySelector(".rd-back"), { x: -20, opacity: 0, duration: 0.5 })
          .from(splitChars(el.querySelector(".rd-title")!).chars, { yPercent: 115, duration: 0.9, ease: "power4.out", stagger: 0.012 }, "<.05")
          .from(el.querySelectorAll(".rd-in"), { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=.6");
        startIntro = (covered) => void (covered ? tl.play() : tl.progress(1));
        el.querySelectorAll(".rd-sec").forEach((s) => {
          gsap.from(s, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%", once: true } });
        });
      });
      return { start: (covered: boolean) => startIntro?.(covered) };
    },
    { scope: root },
  );

  return (
    <main className="page" data-page="case">
      <div className="cs-reader" ref={root}>
        <div className="wrap">
          <TransitionLink href="/case-studies" className="rd-back">
            <Icon name="back" />
            All case studies
          </TransitionLink>
          <div className="rd-meta rd-in">
            <span>
              Case {c.num}, {c.project}
            </span>
            <StatusPill status={c.status} />
            {c.read && <span className="rd-read">{c.read}</span>}
          </div>
          <h1 className="h1 rd-title" tabIndex={-1}>
            {c.title}
          </h1>
          <p className="rd-q rd-in">
            <span>The engineering question</span>
            {c.q}
          </p>
          <div className="rd-flow rd-in">
            <span>System flow in {c.project}</span>
            <FlowPills steps={project.flow} />
          </div>
        </div>
        <div className="wrap rd-grid">
          <nav className="toc" aria-label="Sections">
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={active === t.id ? "on" : undefined}
                aria-current={active === t.id ? "location" : undefined}
                onClick={(e) => {
                  const sec = document.getElementById(t.id);
                  if (!sec) return;
                  e.preventDefault();
                  scrollToY(sec, true);
                  sec.setAttribute("tabindex", "-1");
                  sec.focus({ preventScroll: true });
                }}
              >
                <span className="mono">{t.n}</span>
                {t.label}
              </a>
            ))}
          </nav>
          <article className="rd-body">{children}</article>
        </div>
      </div>
    </main>
  );
}
