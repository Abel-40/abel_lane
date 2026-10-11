"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { projectById } from "@/content";
import type { UiIconKey } from "@/content/icons";
import { rules } from "@/content/rules";
import { animateSectionMarks, rise } from "@/lib/anim";
import { gsap } from "@/lib/gsap";
import { pad2 } from "@/lib/motion";
import { ProjectLink } from "@/components/projects/ProjectLink";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { SectionMark } from "@/components/ui/SectionMark";

/** Per-card hue, partner hue and fill (light tinted glass on 1/3/5, coloured glass on 2/4/6). */
const RV: [string, string, "g-light" | "g-color"][] = [
  ["#2F6EF0", "#6FA5FF", "g-light"],
  ["#1F5BE0", "#36C0F2", "g-color"],
  ["#0E8FD0", "#5ED0FF", "g-light"],
  ["#2340B8", "#4F7BFF", "g-color"],
  ["#4F5BFF", "#8FA0FF", "g-light"],
  ["#1670E0", "#36C0F2", "g-color"],
];

/**
 * 05 — How I build. Sticky stacked glass cards (top grows 18px per card); the previous card scales to .92
 * and dims toward the background as the next arrives; watermarks parallax; orbs drift behind the stack.
 */
export function Principles() {
  const root = useRef<HTMLElement>(null);

  useIdleGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        rise(el.querySelectorAll(".rules-head > *"), el.querySelector(".rules-head"));
        const cards = Array.from(el.querySelectorAll<HTMLElement>(".rule"));
        cards.forEach((r, i) => {
          const inner = r.querySelector<HTMLElement>(".rule-in")!;
          gsap.from(inner, {
            rotation: i % 2 ? 2.5 : -2.5,
            y: 60,
            ease: "none",
            scrollTrigger: { trigger: r, start: "top bottom", end: "top 55%", scrub: true },
          });
          if (i < cards.length - 1) {
            const next = cards[i + 1];
            gsap.to(inner, {
              scale: 0.92,
              "--dim": 0.78,
              ease: "none",
              scrollTrigger: {
                trigger: next,
                start: "top 75%",
                end: () => `top ${parseFloat(getComputedStyle(next).top) || 110}px`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          }
        });
        el.querySelectorAll(".rule-wm").forEach((wm) => {
          gsap.fromTo(wm, { yPercent: 35 }, {
            yPercent: -15,
            ease: "none",
            scrollTrigger: { trigger: wm.closest(".rule"), start: "top bottom", end: "top 20%", scrub: true },
          });
        });
        el.querySelectorAll(".rules-orbs i").forEach((o, i) => {
          gsap.fromTo(
            o,
            { yPercent: i % 2 ? 40 : -20, xPercent: i % 2 ? 10 : -10 },
            {
              yPercent: i % 2 ? -50 : 60,
              xPercent: i % 2 ? -15 : 15,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="wrap rules-sec" aria-labelledby="rules-h" ref={root}>
      <div className="rules-orbs" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <SectionMark num="05" label="Principles" />
      <div className="rules-head">
        <h2 className="h2" id="rules-h">
          How I build.
        </h2>
        <p className="lead">Six rules I keep coming back to, and where each one shows up in my own projects.</p>
      </div>
      <div className="rules">
        {rules.map((r, i) => {
          const v = RV[i % RV.length];
          return (
            <div className="rule" style={{ "--i": i } as React.CSSProperties} key={r.title}>
              <div className={`rule-in ${v[2]}`} style={{ "--dim": 0, "--rc": v[0], "--rc2": v[1] } as React.CSSProperties}>
                <div className="rule-top">
                  <span className="rule-idx">
                    {pad2(i + 1)}
                    <i> / {pad2(rules.length)}</i>
                  </span>
                  <span className="rule-line" />
                  <span className="rule-ico">
                    <Icon name={r.icon as UiIconKey} />
                  </span>
                </div>
                <div className="rule-main">
                  <h3 className="rule-t">{r.title}</h3>
                  <p className="rule-p">{r.desc}</p>
                </div>
                <div className="rule-proof">
                  <span className="rp-k">
                    <b className="rp-dot" />
                    Where it shows up
                  </span>
                  <p>{r.proof}</p>
                  {r.tags.length > 0 && (
                    <div className="rp-tags">
                      {r.tags.map((t) =>
                        t.target === "about" ? (
                          <TransitionLink key={t.label} href="/about" className="rp-tag">
                            {t.label}
                            <Icon name="out" />
                          </TransitionLink>
                        ) : (
                          <ProjectLink key={t.label} slug={projectById(t.target).slug} from=".rp-tag" className="rp-tag">
                            {t.label}
                            <Icon name="out" />
                          </ProjectLink>
                        ),
                      )}
                    </div>
                  )}
                </div>
                <span className="rule-wm" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
