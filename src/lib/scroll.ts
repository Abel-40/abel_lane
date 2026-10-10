"use client";

import type Lenis from "lenis";

let lenis: Lenis | null = null;
let locks = 0;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/** Reference-counted scroll lock (loader, menu, project overlay). */
export function lockScroll(on: boolean) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  const locked = locks > 0;
  document.documentElement.classList.toggle("is-locked", locked);
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
}

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reference scrollToY: numbers scroll to an offset, elements to their top minus the 90px nav. */
export function scrollToY(target: number | HTMLElement, smooth: boolean) {
  if (lenis && smooth) {
    lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -90, duration: 1.4 });
    return;
  }
  const y =
    typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY - 90;
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  window.scrollTo({ top: y, behavior: smooth && !reduce() ? "smooth" : "auto" });
}
