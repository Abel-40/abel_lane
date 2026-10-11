"use client";

import type Lenis from "lenis";
import { flushLazy } from "./idle";

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

/** Document top of an element from its layout box: entrance transforms (a section still at y:50) don't count. */
function layoutTop(el: HTMLElement) {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
  return top;
}

/** Reference scrollToY: numbers scroll to an offset, elements to their top minus the 90px nav. */
export function scrollToY(target: number | HTMLElement, smooth: boolean) {
  // lazy sections above the target must exist (with their pin spacers) before it is measured
  if (typeof target !== "number" || target > 0) flushLazy();
  const y = typeof target === "number" ? target : layoutTop(target) - 90;
  if (lenis && smooth) {
    // Lenis's own position lags a frame behind a native scroll (focus, scrollIntoView); start from the real one
    if (!lenis.isScrolling && Math.abs(lenis.animatedScroll - window.scrollY) > 1) {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
    lenis.scrollTo(y, { duration: 1.4 });
    return;
  }
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  window.scrollTo({ top: y, behavior: smooth && !reduce() ? "smooth" : "auto" });
}
