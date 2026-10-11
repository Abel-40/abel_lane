"use client";

import { useRef } from "react";
import { projects } from "@/content/projects";
import { animateSectionMarks, rise } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";
import { MQ, pad2 } from "@/lib/motion";
import { ProjectArt } from "@/components/art/ProjectArt";
import { ProjectLink } from "@/components/projects/ProjectLink";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { SectionMark } from "@/components/ui/SectionMark";
import { StatusPill } from "@/components/ui/StatusPill";

const TONES = ["", "tone-deep", "", "tone-tint"];

/**
 * 03 — Selected work. Desktop: pinned horizontal rail of the first four projects plus an end card; the
 * counter follows the card nearest the centre, cards scale .9→1 and rotate 2°→0° as they enter, art
 * parallaxes ±4%. Mobile: a vertical stack.
 */
export function WorkRail() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".wcard, .wend"));

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        rise(el.querySelectorAll(".work-head > *"), el.querySelector(".work-head"));
      });

      mm.add(MQ.desktop, () => {
        el.classList.add("is-pinned");
        const track = el.querySelector<HTMLElement>(".work-track")!;
        const cur = el.querySelector<HTMLElement>(".wc-cur")!;
        const bar = el.querySelector<HTMLElement>(".work-bar i")!;
        const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
        const railTw = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: el.querySelector(".work-pin"),
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              bar.style.transform = `scaleX(${Math.max(0.2, self.progress)})`;
              const mid = window.innerWidth / 2;
              let best = 0;
              let bd = Infinity;
              cards.forEach((cd, i) => {
                const r = cd.getBoundingClientRect();
                const dd = Math.abs(r.left + r.width / 2 - mid);
                if (dd < bd) {
                  bd = dd;
                  best = i;
                }
              });
              cur.textContent = pad2(Math.min(best, 3) + 1);
            },
          },
        });
        cards.forEach((cd) => {
          const art = cd.querySelector(".wc-art .art");
          if (art) {
            gsap.fromTo(art, { xPercent: -4 }, {
              xPercent: 4,
              ease: "none",
              scrollTrigger: { trigger: cd, containerAnimation: railTw, start: "left right", end: "right left", scrub: true },
            });
          }
          gsap.fromTo(cd, { scale: 0.9, rotation: 2 }, {
            scale: 1,
            rotation: 0,
            ease: "none",
            scrollTrigger: { trigger: cd, containerAnimation: railTw, start: "left 100%", end: "left 55%", scrub: true },
          });
        });
        return () => {
          el.classList.remove("is-pinned");
          cur.textContent = "01";
          bar.style.transform = "";
        };
      });

      mm.add(MQ.mobile, () => {
        cards.forEach((cd) => rise([cd], cd, { y: 60 }));
      });
    },
    { scope: root },
  );

  return (
    <section className="work" id="work" aria-labelledby="work-h" ref={root}>
      <div className="work-pin">
        <div className="wrap">
          <SectionMark num="03" label="Projects" />
        </div>
        <div className="wrap work-head">
          <div>
            <h2 className="h2" id="work-h">
              Selected work
            </h2>
            <p>Four products, each starting from a question someone actually has.</p>
          </div>
          <div className="work-meta" aria-hidden="true">
            <span className="work-count">
              <b className="wc-cur">01</b> / 04
            </span>
            <span className="work-bar">
              <i />
            </span>
          </div>
        </div>
        <div className="work-scroller">
          <div className="work-track">
            {projects.slice(0, 4).map((p, i) => {
              const deep = TONES[i] === "tone-deep";
              return (
                <article className={`wcard ${TONES[i]}${deep ? " on-deep" : ""}`.trim()} data-id={p.id} key={p.id}>
                  <div className="wc-art">
                    <ProjectArt art={p.art} />
                  </div>
                  <div className="wc-body">
                    <div className="wc-top">
                      <span className="wc-num" aria-hidden="true">
                        {p.num}
                      </span>
                      <StatusPill status={p.status} />
                    </div>
                    <h3 className="wc-name">{p.name}</h3>
                    <p className="wc-tag">{p.tagline}</p>
                    <p className="wc-hook">{p.hook}</p>
                    <ul className="chips">
                      {p.chips.map((c) => (
                        <li className="chip" key={c}>
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="wc-foot">
                      <ProjectLink
                        slug={p.slug}
                        className={`btn btn-sm ${deep ? "btn-light" : "btn-accent"}`}
                        data-cursor="Open"
                        aria-label={`Open project: ${p.name}`}
                      >
                        Open project <Icon name="arrow" className="ico-arrow" />
                      </ProjectLink>
                      <span className="wc-kind">{p.kindLabel}</span>
                    </div>
                  </div>
                </article>
              );
            })}
            <div className="wend">
              <h3>That’s the highlight reel.</h3>
              <p>There’s one more in the full list. See all five projects side by side, filter them, and open the write-ups.</p>
              <TransitionLink href="/projects" className="btn btn-light btn-sm">
                All projects <Icon name="arrow" className="ico-arrow" />
              </TransitionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
