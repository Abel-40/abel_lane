"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { siblingProjects } from "@/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { getLastPage } from "@/lib/nav-history";
import { prefersReducedMotion } from "@/lib/motion";
import { ART_VT_NAME, isArtMorphing, overlayReady, takeOverlaySource } from "@/lib/overlay";
import { lockScroll } from "@/lib/scroll";
import { uiStore } from "@/lib/ui-store";
import { useTransitionRouter } from "@/components/transition/TransitionProvider";
import { MarkupIcon } from "@/components/ui/Icon";
import { ProjectBody } from "./ProjectBody";
import { useProjectSwitch } from "./useProjectSwitch";

const rectInset = (r: DOMRect) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return `inset(${Math.max(0, r.top)}px ${Math.max(0, vw - r.right)}px ${Math.max(0, vh - r.bottom)}px ${Math.max(0, r.left)}px round 28px)`;
};

/**
 * Project detail as an intercepted modal (reference openProject/closeProject): the background expands from
 * the clicked card (clip-path, expo.inOut .85s), the bar drops in and the sections rise; focus is trapped;
 * Esc/close collapses it back to the card and returns focus. Browser back closes it instantly (PARITY D5).
 */
export function ProjectOverlay({ slug }: { slug: string }) {
  const router = useRouter();
  const { navigate } = useTransitionRouter();
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const src = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const { project, switchTo } = useProjectSwitch(slug, "overlay", content);

  useEffect(() => {
    lockScroll(true);
    uiStore.set({ overlayOpen: true, menuOpen: false, menuInstant: true });
    const rf = returnFocus;
    return () => {
      lockScroll(false);
      uiStore.set({ overlayOpen: false });
      const back = rf.current;
      if (back && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, []);

  useGSAP(
    () => {
      // layout effect: runs before the effects above, so capture the source card and focus origin here
      src.current = takeOverlaySource();
      returnFocus.current ??= (document.activeElement as HTMLElement) ?? null;
      const el = root.current!;
      const name = () => el.querySelector<HTMLElement>("#poName")?.focus({ preventScroll: true });
      // View Transition (progressive enhancement): the card art morphs into this panel, so name it and leave it
      // out of the rise-in below; the clip-path expand still runs underneath.
      const morph = isArtMorphing();
      if (morph) {
        const art = el.querySelector<HTMLElement>(".po-art");
        if (art) art.style.viewTransitionName = ART_VT_NAME;
        overlayReady();
      }
      if (prefersReducedMotion()) {
        name();
        return;
      }
      const s = src.current;
      const r = s && s.isConnected ? s.getBoundingClientRect() : null;
      const from = r
        ? rectInset(r)
        : `inset(${innerHeight / 2}px ${innerWidth / 2}px ${innerHeight / 2}px ${innerWidth / 2}px round 28px)`;
      gsap
        .timeline()
        .fromTo(el.querySelector(".po-bg"), { clipPath: from }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.85, ease: "expo.inOut" })
        .fromTo(el.querySelector(".po-bar"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4 }, "-=.3")
        // opacity (not opacity) so the name stays focusable while it rises in
        .fromTo(el.querySelectorAll(morph ? ".po-in:not(.po-art)" : ".po-in"), { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06 }, "-=.35")
        .add(name, "<");
    },
    { scope: root },
  );

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = root.current;
    if (!el || prefersReducedMotion()) {
      router.back();
      return;
    }
    const s = src.current;
    const target =
      s && s.isConnected && s.offsetParent ? rectInset(s.getBoundingClientRect()) : "inset(50% 50% 50% 50% round 28px)";
    gsap
      .timeline({ onComplete: () => router.back() })
      .to([el.querySelector(".po-content"), el.querySelector(".po-bar")], { opacity: 0, duration: 0.25 })
      .to(el.querySelector(".po-bg"), { clipPath: target, duration: 0.7, ease: "expo.inOut" }, "-=.05");
  }, [router]);

  /* Esc closes; Tab is trapped inside the dialog */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = root.current;
      if (!el) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const f = Array.from(el.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')).filter(
        (x) => x.offsetParent !== null,
      );
      if (!f.length) return;
      const a = f[0];
      const z = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const sib = siblingProjects(project.id);

  return (
    <div className="po" ref={root} role="dialog" aria-modal="true" aria-labelledby="poName">
      <div className="po-bg" />
      <div className="po-scroll" data-lenis-prevent="">
        <div className="wrap po-bar">
          <nav className="po-crumb" aria-label="Breadcrumb">
            <button
              type="button"
              className="crumb-link"
              onClick={() => (getLastPage() === "/projects" ? close() : navigate("/projects"))}
            >
              <MarkupIcon name="prev" />
              projects
            </button>
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
            <button type="button" className="icon-btn" aria-label="Close project" onClick={close}>
              <MarkupIcon name="close" />
            </button>
          </div>
        </div>
        <div className="wrap po-content" ref={content}>
          <ProjectBody p={project} heading="h2" onNext={switchTo} />
        </div>
      </div>
    </div>
  );
}
