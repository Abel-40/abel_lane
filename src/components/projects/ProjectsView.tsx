"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { projects } from "@/content/projects";
import type { ProjectCategory } from "@/content/types";
import { pageIntro, revealable } from "@/lib/anim";
import { Flip } from "@/lib/flip";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion";
import { ProjectArt } from "@/components/art/ProjectArt";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProjectLink } from "./ProjectLink";

type Filter = "all" | ProjectCategory;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI and retrieval" },
  { id: "async", label: "Async and data" },
  { id: "fullstack", label: "Full-stack" },
  { id: "mobile", label: "Mobile" },
];

/** Projects list: hero, filters (sliding pill, aria-pressed, live count, Flip re-flow) and tilting cards. */
export function ProjectsView() {
  const root = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const flipState = useRef<Flip.FlipState | null>(null);

  const placePill = useCallback(() => {
    const el = root.current;
    const on = el?.querySelector<HTMLElement>(".filter.on");
    const pill = el?.querySelector<HTMLElement>(".f-pill");
    if (!on || !pill || !on.offsetParent) return;
    pill.style.width = `${on.offsetWidth}px`;
    pill.style.height = `${on.offsetHeight}px`;
    pill.style.transform = `translate(${on.offsetLeft}px,${on.offsetTop}px)`;
  }, []);

  useEffect(() => {
    placePill();
    window.addEventListener("resize", placePill);
    document.fonts?.ready.then(placePill);
    return () => window.removeEventListener("resize", placePill);
  }, [placePill]);

  useIntroGSAP(
    () => {
      let startIntro: ((covered: boolean) => void) | null = null;
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = pageIntro(el.querySelector(".pg-hero")!, { paused: true });
        startIntro = (covered) => void (covered ? intro.play() : intro.progress(1));
        const cells = revealable(Array.from(el.querySelectorAll<HTMLElement>(".pcell")));
        gsap.set(cells, { y: 70, opacity: 0 });
        ScrollTrigger.batch(cells, {
          start: "top 92%",
          once: true,
          onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1 }),
        });
        if (!isFinePointer()) return;
        const offs = Array.from(el.querySelectorAll<HTMLElement>(".pcard")).map((card) => {
          gsap.set(card, { transformPerspective: 1000 });
          const tx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3" });
          const ty = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3" });
          const tz = gsap.quickTo(card, "y", { duration: 0.6, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            ty(((e.clientX - r.left) / r.width - 0.5) * 8);
            tx(-((e.clientY - r.top) / r.height - 0.5) * 8);
            tz(-6);
          };
          const leave = () => {
            tx(0);
            ty(0);
            tz(0);
          };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          };
        });
        return () => {
          offs.forEach((f) => f());
        };
      });
      return { start: (covered: boolean) => startIntro?.(covered) };
    },
    { scope: root },
  );

  useLayoutEffect(() => {
    const el = root.current!;
    const cells = Array.from(el.querySelectorAll<HTMLElement>(".pcell"));
    cells.forEach((c) => {
      const m = filter === "all" || (c.dataset.cats ?? "").split(" ").includes(filter);
      c.style.display = m ? "" : "none";
    });
    placePill();
    const state = flipState.current;
    flipState.current = null;
    if (!state) return;
    Flip.from(state, {
      duration: 0.7,
      ease: "power3.inOut",
      scale: true,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.45 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter, placePill]);

  const choose = (f: Filter) => {
    if (f === filter) return;
    if (!prefersReducedMotion()) flipState.current = Flip.getState(root.current!.querySelectorAll(".pcell"));
    setFilter(f);
  };

  const shown = projects.filter((p) => filter === "all" || p.cats.includes(filter)).length;

  return (
    <main className="page" data-page="projects" ref={root}>
      <section className="wrap pg-hero">
        <p className="kicker">Projects</p>
        <h1 className="h1" data-split="" tabIndex={-1}>
          Five products, each built around a real problem.
        </h1>
        <p className="lead hero-fade">
          Each one starts with a question someone actually has. Open any project for the story, its capabilities, the
          system flow and the stack.
        </p>
        <div className="f-bar hero-fade">
          <div className="filters" role="group" aria-label="Filter projects">
            <span className="f-pill" aria-hidden="true" />
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.id}
                className={f.id === filter ? "filter on" : "filter"}
                aria-pressed={f.id === filter}
                onClick={() => choose(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="f-count" aria-live="polite">
            Showing {shown} of {projects.length}
          </span>
        </div>
      </section>
      <section className="wrap" aria-label="Project list">
        <div className="pgrid">
          {projects.map((p) => (
            <div className="pcell" data-cats={p.cats.join(" ")} key={p.id}>
              <ProjectLink slug={p.slug} className="pcard" data-cursor="Open" aria-label={`Open project: ${p.name}`}>
                <span className="pc-art">
                  <ProjectArt art={p.art} />
                </span>
                <span className="pc-body">
                  <span className="pc-top">
                    <span className="pc-tagline">{p.tagline}</span>
                    <StatusPill status={p.status} />
                  </span>
                  <span className="pc-name">{p.name}</span>
                  <span className="pc-hook">{p.hook}</span>
                  <span className="chips">
                    {p.chips.map((c) => (
                      <span className="chip" key={c}>
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="pc-foot">
                    <span className="pc-more">
                      View project <Icon name="arrow" />
                    </span>
                    <span className="pc-kind">{p.kindLabel}</span>
                  </span>
                </span>
              </ProjectLink>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
