"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { site } from "@/content/site";
import { animateSectionMarks, rise, splitWords } from "@/lib/anim";
import { gsap } from "@/lib/gsap";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Clock } from "@/components/ui/Clock";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { SectionMark } from "@/components/ui/SectionMark";

/** 07 — Hiring for a backend or AI role? Words rise in, then the lead, the magnetic ball and the meta row. */
export function Cta() {
  const root = useRef<HTMLElement>(null);

  useIdleGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        const title = el.querySelector(".cta-title")!;
        gsap.from(splitWords(title).words, {
          yPercent: 115,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: { trigger: title, start: "top 86%", once: true },
        });
        rise(el.querySelectorAll(".cta-row .lead, .cta-ball, .cta-meta"), el.querySelector(".cta-row"));
        gsap.from(el.querySelector(".cta-ball"), {
          rotation: -90,
          scale: 0.4,
          duration: 1.2,
          ease: "elastic.out(1, .5)",
          scrollTrigger: { trigger: el.querySelector(".cta-row"), start: "top 86%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="wrap cta" aria-labelledby="cta-h" ref={root}>
      <SectionMark num="07" label="Contact" />
      <h2 className="cta-title" id="cta-h">
        Hiring for a backend or AI role?
      </h2>
      <div className="cta-row">
        <p className="lead">
          I’m open to remote backend, AI systems and freelance work. Tell me what you’re building and I’ll reply within
          24 hours.
        </p>
        <TransitionLink href="/contact" className="cta-ball" data-magnetic="">
          Let’s talk
        </TransitionLink>
      </div>
      <div className="cta-meta">
        <span>
          It’s <Clock /> in Addis Ababa
        </span>
        <span className="copy-line">
          <span className="email-text">{site.email}</span>
          <CopyEmailButton />
        </span>
      </div>
    </section>
  );
}
