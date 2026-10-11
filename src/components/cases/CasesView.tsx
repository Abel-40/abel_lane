"use client";

import { useRef, useState } from "react";
import { caseHref, cases, projectById } from "@/content";
import type { ArtKey } from "@/content/types";
import { pageIntro, rise } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenIntro } from "@/lib/intro";
import { isFinePointer } from "@/lib/motion";
import { ProjectArt } from "@/components/art/ProjectArt";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

const STEPS = [
  ["01", "Context", "The real problem"],
  ["02", "Design", "Architecture and decisions"],
  ["03", "Implementation", "The difficult parts"],
  ["04", "Validation", "Measured results"],
  ["05", "Reflection", "What I learned"],
] as const;

/**
 * Case-study list: hero with a five-part step strip (line draws across, steps rise), rows with number,
 * title, question, project and status; hovering a row shows a floating, slightly rotated art preview.
 */
export function CasesView() {
  const root = useRef<HTMLElement>(null);
  const [art, setArt] = useState<ArtKey>("mood");

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hero = el.querySelector(".cs-hero")!;
        const tl = gsap.timeline({ paused: true });
        tl.add(pageIntro(hero), 0).add(
          gsap
            .timeline()
            .from(el.querySelector(".cs-steps-line i"), { scaleX: 0, duration: 1.3, ease: "power3.inOut" })
            .from(el.querySelectorAll(".cs-step"), { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, "<.1"),
          0.5,
        );
        const cancel = whenIntro((covered) => (covered ? tl.play() : tl.progress(1)));
        rise(el.querySelectorAll(".cs-row-btn"), el.querySelector(".cs-rows"), { stagger: 0.07 });

        if (!isFinePointer()) return cancel;
        const prev = el.querySelector<HTMLElement>(".cs-preview")!;
        const rows = el.querySelector<HTMLElement>(".cs-rows")!;
        gsap.set(prev, { scale: 0.8 });
        const px = gsap.quickTo(prev, "x", { duration: 0.55, ease: "power3" });
        const py = gsap.quickTo(prev, "y", { duration: 0.55, ease: "power3" });
        const move = (e: PointerEvent) => {
          px(e.clientX + 28);
          py(e.clientY - 90);
        };
        const over = (e: PointerEvent) => {
          const b = (e.target as Element).closest<HTMLElement>(".cs-row-btn");
          if (!b) return;
          setArt(b.dataset.preview as ArtKey);
          gsap.to(prev, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        };
        const leave = () => gsap.to(prev, { autoAlpha: 0, scale: 0.8, rotation: 0, duration: 0.35, overwrite: "auto" });
        rows.addEventListener("pointermove", move);
        rows.addEventListener("pointerover", over);
        rows.addEventListener("pointerleave", leave);
        return () => {
          cancel();
          rows.removeEventListener("pointermove", move);
          rows.removeEventListener("pointerover", over);
          rows.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root },
  );

  return (
    <main className="page" data-page="cases" ref={root}>
      <section className="wrap cs-hero">
        <p className="kicker">Case studies</p>
        <h1 className="h1" data-split="" tabIndex={-1}>
          The decisions behind the code.
        </h1>
        <p className="lead hero-fade">
          Projects show what I built. Case studies show how I think: what I tried, what I rejected, and why.
        </p>
        <ol className="cs-steps" aria-label="Every case study follows the same five parts">
          <span className="cs-steps-line" aria-hidden="true">
            <i />
          </span>
          {STEPS.map(([n, t, s]) => (
            <li className="cs-step" key={n}>
              <b>{n}</b>
              <span>{t}</span>
              <small>{s}</small>
            </li>
          ))}
        </ol>
      </section>
      <section className="wrap" aria-label="Case studies">
        <ul className="cs-rows">
          {cases.map((c) => (
            <li key={c.id}>
              <TransitionLink
                href={caseHref(c)}
                className="cs-row-btn"
                data-cursor="Read"
                data-preview={projectById(c.projectId).art}
              >
                <span className="cs-num" aria-hidden="true">
                  {c.num}
                </span>
                <span>
                  <span className="cs-title">{c.title}</span>
                  <span className="cs-q">{c.q}</span>
                </span>
                <span className="cs-side">
                  <span className="cs-proj">{c.project}</span>
                  <StatusPill status={c.status} />
                </span>
                <span className="cs-go" aria-hidden="true">
                  <Icon name="arrow" />
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </section>
      <div className="cs-preview" aria-hidden="true">
        <ProjectArt art={art} />
      </div>
    </main>
  );
}
