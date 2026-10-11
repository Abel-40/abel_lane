"use client";

/* The element a project overlay expands from (and collapses back to): the clicked card. Also coordinates the
   optional View Transition that morphs the card's art into the overlay's art panel. */

let source: HTMLElement | null = null;
let morphing = false;
let onReady: (() => void) | null = null;

export function setOverlaySource(el: HTMLElement | null) {
  source = el;
}

export function takeOverlaySource(): HTMLElement | null {
  return source;
}

/** True while a card → overlay art morph (View Transition) is running. */
export function isArtMorphing() {
  return morphing;
}

/** Called by the overlay once its art panel is in the DOM and named. */
export function overlayReady() {
  onReady?.();
  onReady = null;
}

export const ART_VT_NAME = "project-art";

/**
 * Progressive enhancement (View Transitions API): morph the clicked card's art panel into the overlay's
 * while the GSAP clip-path expand runs underneath. Returns false when unsupported or reduced motion, so the
 * caller falls back to the plain navigation.
 */
export function startArtMorph(card: HTMLElement | null, navigate: () => void): boolean {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };
  const art = card?.querySelector<HTMLElement>(".wc-art, .pc-art");
  if (!doc.startViewTransition || !art || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  morphing = true;
  art.style.viewTransitionName = ART_VT_NAME;
  const vt = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        art.style.viewTransitionName = "";
        const timeout = setTimeout(resolve, 1500); // never hold the page frozen
        onReady = () => {
          clearTimeout(timeout);
          resolve();
        };
        navigate();
      }),
  );
  vt.finished.finally(() => {
    morphing = false;
    document.querySelectorAll<HTMLElement>(".po-art").forEach((el) => (el.style.viewTransitionName = ""));
  });
  return true;
}
