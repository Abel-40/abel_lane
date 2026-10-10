/* Motion vocabulary from DESIGN.md › Motion. Keep the reference values; change them here only. */

export const MQ = {
  desktop: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 899.98px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  wide: "(min-width: 900px)",
  fine: "(hover: hover) and (pointer: fine)",
} as const;

export const EASE = {
  css: "cubic-bezier(.2, .7, .2, 1)",
  enter: "power3.out",
  type: "power4.out",
  cover: "power4.inOut",
  expand: "expo.inOut",
  spring: "elastic.out(1, .45)",
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;
}

export function isFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MQ.fine).matches;
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MQ.wide).matches;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
