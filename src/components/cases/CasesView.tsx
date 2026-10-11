"use client";

import { useRef, useState } from "react";
import { caseHref, cases } from "@/content";
import { variantPath } from "@/content/image-variants";
import type { CaseFigure } from "@/content/types";
import { pageIntro, rise } from "@/lib/anim";
import { gsap } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
import { isFinePointer } from "@/lib/motion";
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

/** The preview card is 320px wide: the 360w file, or 720w on dense screens. Only called after a hover. */
const previewSrc = (f: CaseFigure) => variantPath(f.src, window.devicePixelRatio > 1.2 ? 720 : 360);

/**
 * Case-study list: hero with a five-part step strip (line draws across, steps rise), rows with number,
 * title, question, project and status; hovering a row shows that case's figure in a floating, slightly rotated card.
 */
export function CasesView() {
  const root = useRef<HTMLElement>(null);
  // null until the first hover, so touch devices never fetch a preview they can't see
  const [preview, setPreview] = useState<CaseFigure | null>(null);

  useIntroGSAP(
    () => {
      let startIntro: ((covered: boolean) => void) | null = null;
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hero = el.querySelector(".cs-hero")!;
        const tl = gsap.timeline({ paused: true });
        tl.add(pageIntro(hero), 0).add(
          gsap
            .timeline()
            .from(el.querySelector(".cs-steps-line i"), { scaleX: 0, duration: 1.3, ease: "power3.inOut" })
            .from(el.querySelectorAll(".cs-step"), { y: 24, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, "<.1"),
          0.5,
        );
        startIntro = (covered) => void (covered ? tl.play() : tl.progress(1));
        rise(el.querySelectorAll(".cs-row-btn"), el.querySelector(".cs-rows"), { stagger: 0.07 });

        if (!isFinePointer()) return;
        const prev = el.querySelector<HTMLElement>(".cs-preview")!;
        let preloaded = false;
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
          if (!preloaded) {
            preloaded = true; // first hover: fetch all five preview-size figures so swaps never flash
            cases.forEach((c) => (new Image().src = previewSrc(c.figure)));
          }
          setPreview(cases.find((c) => c.id === b.dataset.case)!.figure);
          gsap.to(prev, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        };
        const leave = () => gsap.to(prev, { autoAlpha: 0, scale: 0.8, rotation: 0, duration: 0.35, overwrite: "auto" });
        rows.addEventListener("pointermove", move);
        rows.addEventListener("pointerover", over);
        rows.addEventListener("pointerleave", leave);
        return () => {
          rows.removeEventListener("pointermove", move);
          rows.removeEventListener("pointerover", over);
          rows.removeEventListener("pointerleave", leave);
        };
      });
      return { start: (covered: boolean) => startIntro?.(covered) };
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
                data-case={c.id}
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
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- pre-optimised WebP figure
          <img src={previewSrc(preview)} width={960} height={600} alt="" decoding="async" />
        )}
      </div>
    </main>
  );
}
