"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { projectBySlug } from "@/content";
import { site } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Switches the shown project in place (reference switchProject): content fades up and out, the next
 * project's sections rise in, focus moves to its name and the URL follows via the History API, which
 * Next.js syncs into its router without a navigation (so no nested interception).
 */
export function useProjectSwitch(initialSlug: string, mode: "overlay" | "page", content: React.RefObject<HTMLElement | null>) {
  const [slug, setSlug] = useState(initialSlug);
  const pending = useRef(false);
  const project = projectBySlug(slug)!;

  // The overlay sits over another page: put that page's title back when it closes.
  useLayoutEffect(() => {
    const original = document.title;
    return () => {
      if (mode === "overlay") document.title = original;
    };
  }, [mode]);

  const switchTo = useCallback(
    (next: string) => {
      if (next === slug) return;
      const url = `/projects/${next}`;
      if (mode === "overlay") window.history.replaceState(window.history.state, "", url);
      else window.history.pushState(window.history.state, "", url);
      const el = content.current;
      if (!el || prefersReducedMotion()) {
        setSlug(next);
        return;
      }
      gsap.to(el, {
        autoAlpha: 0,
        y: -20,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(el, { clearProps: "all" });
          pending.current = true;
          setSlug(next);
        },
      });
    },
    [slug, mode, content],
  );

  // After the new project renders: rise its sections in, focus the name, reset scroll, update the title.
  useLayoutEffect(() => {
    const p = projectBySlug(slug);
    if (p) document.title = `${p.name} | ${site.name}`;
    if (!pending.current) return;
    pending.current = false;
    const el = content.current;
    if (!el) return;
    el.closest(".po-scroll")?.scrollTo({ top: 0 });
    if (mode === "page") window.scrollTo({ top: 0 });
    gsap.fromTo(el.querySelectorAll(".po-in"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.05 });
    el.querySelector<HTMLElement>("#poName")?.focus({ preventScroll: true });
  }, [slug, mode, content]);

  // Page mode uses pushState, so keep the shown project in sync with back/forward.
  useEffect(() => {
    if (mode !== "page") return;
    const onPop = () => {
      const m = window.location.pathname.match(/^\/projects\/([^/]+)/);
      if (m && projectBySlug(m[1])) setSlug(m[1]);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [mode]);

  return { slug, project, switchTo };
}
