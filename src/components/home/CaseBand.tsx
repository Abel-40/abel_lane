"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { caseHref, cases } from "@/content";
import { animateSectionMarks, rise, scramble } from "@/lib/anim";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { SectionMark } from "@/components/ui/SectionMark";

const QUESTION = "How do you recommend scripture by mood without ever letting an LLM invent a verse?";

/** 06 — Deep dive: navy band; the question decodes in (scramble), with links to the reader and more write-ups. */
export function CaseBand() {
  const root = useRef<HTMLElement>(null);
  const lead = cases[0];

  useIdleGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        const q = el.querySelector<HTMLElement>("[data-scramble]")!;
        ScrollTrigger.create({ trigger: q, start: "top 82%", once: true, onEnter: () => void scramble(q) });
        rise(el.querySelectorAll(".cb-label, .cb-a, .cb-btns"), el);
        rise(el.querySelectorAll(".cb-item"), el.querySelector(".cb-list"), { x: 40, y: 0 });
        gsap.fromTo(el, { clipPath: "inset(6% 4% 6% 4% round 40px)" }, {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: true },
        });
        return () => {
          q.textContent = QUESTION;
        };
      });
    },
    { scope: root },
  );

  return (
    <section className="case-band on-deep" aria-labelledby="cb-q" ref={root}>
      <div className="wrap cb-mark">
        <SectionMark num="06" label="Deep dive" />
      </div>
      <div className="wrap cb-grid">
        <div>
          <p className="cb-label">Case study 01, MoodVerse</p>
          <h2 className="cb-q" id="cb-q">
            <span className="sr-only">{QUESTION}</span>
            <span aria-hidden="true" data-scramble="">
              {QUESTION}
            </span>
          </h2>
          <p className="cb-a">
            Split interpretation from retrieval. The model reads the reflection, and a verified corpus supplies every
            passage.
          </p>
          <div className="cb-btns">
            <TransitionLink href={caseHref(lead)} className="btn btn-light" data-magnetic="">
              Read the case study <Icon name="arrow" className="ico-arrow" />
            </TransitionLink>
            <TransitionLink href="/case-studies" className="btn btn-ghost-deep">
              All case studies
            </TransitionLink>
          </div>
        </div>
        <div className="cb-list">
          <p>More write-ups</p>
          {cases.slice(1).map((c) => (
            <TransitionLink key={c.id} href={caseHref(c)} className="cb-item">
              <b>{c.title}</b>
              <small>
                {c.project}, {c.status.toLowerCase()}
              </small>
              <Icon name="out" />
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
