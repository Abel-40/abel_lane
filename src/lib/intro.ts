"use client";

/* Intro gate. Page entrance timelines wait here while the loader or the route shutter is covering
   the screen, then play when the cover lifts (reference: showPage(route, { delay: 1.85 | .42 })). */

type Fn = () => void;

let held = false;
let waiters: Fn[] = [];

if (typeof document !== "undefined") {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The pre-paint script marks data-loader="off" when the loader will not run.
  held = !reduce && root.dataset.loader !== "off";
}

export function holdIntro() {
  held = true;
}

export function releaseIntro() {
  held = false;
  const w = waiters;
  waiters = [];
  w.forEach((f) => f());
}

export function isIntroHeld() {
  return held;
}

/**
 * Runs `cb` now, or when the cover lifts. `covered` is true when a loader or shutter hid the page while it
 * mounted, i.e. the entrance animation will be seen from its first frame. On a hard reload without the
 * loader the content is already painted, so pages skip their above-the-fold intro (no flicker, faster LCP).
 * Returns a cancel function for cleanup.
 */
export function whenIntro(cb: (covered: boolean) => void): Fn {
  if (!held) {
    cb(false);
    return () => {};
  }
  const w = () => cb(true);
  waiters.push(w);
  return () => {
    waiters = waiters.filter((x) => x !== w);
  };
}
