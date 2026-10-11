"use client";

import { useRef } from "react";
import { animateSectionMarks, rise, splitPlain } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionMark } from "@/components/ui/SectionMark";

/** 01 — each word goes from opacity .13 to 1 as you scroll (scrub .4), then the signature rises. */
export function Statement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        const text = el.querySelector(".st-text")!;
        const words = splitPlain(text).words;
        gsap.fromTo(
          words,
          { opacity: 0.13 },
          { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: text, start: "top 82%", end: "bottom 48%", scrub: 0.4 } },
        );
        rise(el.querySelector(".st-by"), el);
      });
    },
    { scope: root },
  );

  return (
    <section className="wrap statement" ref={root}>
      <SectionMark num="01" label="What I care about" />
      <p className="st-text">
        I care less about adding AI for its own sake, and more about making it useful, reliable and connected to real
        product workflows.
      </p>
      <p className="st-by">Abel, after moving from UI/UX and full-stack work to the backend</p>
    </section>
  );
}
