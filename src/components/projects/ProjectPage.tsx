"use client";

import { useRef } from "react";
import { siblingProjects } from "@/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenIntro } from "@/lib/intro";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { MarkupIcon } from "@/components/ui/Icon";
import { ProjectBody } from "./ProjectBody";
import { useProjectSwitch } from "./useProjectSwitch";

/** Full-page project detail for direct visits and reloads; same content and controls as the overlay. */
export function ProjectPage({ slug }: { slug: string }) {
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { project, switchTo } = useProjectSwitch(slug, "page", content);
  const sib = siblingProjects(project.id);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ paused: true })
          .from(root.current!.querySelector(".po-bar"), { autoAlpha: 0, y: -10, duration: 0.4 })
          .from(root.current!.querySelectorAll(".po-in"), { y: 46, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.06 }, "-=.2");
        return whenIntro((covered) => (covered ? tl.play() : tl.progress(1)));
      });
    },
    { scope: root },
  );

  return (
    <main className="page po-page" data-page="project" ref={root}>
      <div className="wrap po-bar">
        <nav className="po-crumb" aria-label="Breadcrumb">
          <TransitionLink href="/projects" className="crumb-link">
            <MarkupIcon name="prev" />
            projects
          </TransitionLink>
          <span className="crumb-sep" aria-hidden="true">
            /
          </span>
          <b aria-current="page">{project.slug}</b>
        </nav>
        <div className="po-actions">
          <button type="button" className="icon-btn" aria-label="Previous project" onClick={() => switchTo(sib.prev.slug)}>
            <MarkupIcon name="prev" />
          </button>
          <button type="button" className="icon-btn" aria-label="Next project" onClick={() => switchTo(sib.next.slug)}>
            <MarkupIcon name="next" />
          </button>
          <TransitionLink href="/projects" className="icon-btn" aria-label="Close project">
            <MarkupIcon name="close" />
          </TransitionLink>
        </div>
      </div>
      <div className="wrap po-content" ref={content}>
        <ProjectBody p={project} heading="h1" onNext={switchTo} />
      </div>
    </main>
  );
}
