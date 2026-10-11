"use client";

import { useRef } from "react";
import { siblingProjects } from "@/content";
import { gsap } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
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

  useIntroGSAP(
    () => {
      let startIntro: ((covered: boolean) => void) | null = null;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap
          .timeline({ paused: true })
          .from(root.current!.querySelector(".po-bar"), { opacity: 0, y: -10, duration: 0.4 })
          .from(root.current!.querySelectorAll(".po-in"), { y: 46, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.06 }, "-=.2");
        startIntro = (covered) => void (covered ? tl.play() : tl.progress(1));
      });
      return { start: (covered: boolean) => startIntro?.(covered) };
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
