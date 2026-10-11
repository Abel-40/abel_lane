"use client";

import { gsap, ScrollTrigger, SplitText } from "./gsap";

/* Animation helpers ported from the reference (rise, split, heroIntro, scramble, fracOf, section markers).
   Call them inside a useGSAP callback so everything they create is reverted on unmount. */

type Targets = gsap.TweenTarget;

/** Reference `rise`: y 46 → 0 with a fade, power3.out 1s, stagger .08, once at "top 86%". */
export function rise(targets: Targets, trigger?: gsap.DOMTarget | null, extra: gsap.TweenVars = {}) {
  const els = gsap.utils.toArray<Element>(targets).filter(Boolean);
  if (!els.length) return null;
  return gsap.from(els, {
    y: 46,
    autoAlpha: 0,
    duration: 1,
    ease: "power3.out",
    stagger: 0.08,
    scrollTrigger: { trigger: (trigger as Element) ?? els[0], start: "top 86%", once: true },
    ...extra,
  });
}

/** Split into masked words → chars (reference split "chars"). `aria:false` when an ancestor is aria-hidden. */
export function splitChars(el: Element, aria = true) {
  return SplitText.create(el, {
    type: "words,chars",
    wordsClass: "sw",
    charsClass: "ch",
    mask: "words",
    tag: "span",
    aria: aria ? "auto" : "none",
  });
}

/** Masked words (reference split "words"). */
export function splitWords(el: Element, aria = true) {
  return SplitText.create(el, { type: "words", wordsClass: "wi", mask: "words", tag: "span", aria: aria ? "auto" : "none" });
}

/** Unmasked words (reference split "plain"), used by the statement's opacity scrub. */
export function splitPlain(el: Element, aria = true) {
  return SplitText.create(el, { type: "words", wordsClass: "wd", tag: "span", aria: aria ? "auto" : "none" });
}

/** Reference heroIntro: kicker, split H1 chars, then .hero-fade items. */
export function pageIntro(root: Element, opts: { delay?: number; paused?: boolean } = {}) {
  const tl = gsap.timeline({ delay: opts.delay ?? 0, paused: opts.paused });
  const kicker = root.querySelector(".kicker");
  const h = root.querySelector("[data-split]");
  if (kicker) tl.from(kicker, { y: 16, autoAlpha: 0, duration: 0.6, ease: "power3.out" });
  if (h) tl.from(splitChars(h).chars, { yPercent: 118, duration: 1.05, ease: "power4.out", stagger: 0.014 }, "<.05");
  const fades = root.querySelectorAll(".hero-fade");
  if (fades.length) tl.from(fades, { y: 26, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=.75");
  return tl;
}

/** Reference scramble/decode: 1.8s power2.inOut, random glyphs resolve left to right. */
export function scramble(el: HTMLElement) {
  const final = el.dataset.final ?? el.textContent ?? "";
  el.dataset.final = final;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz0123456789/{}<>_";
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration: 1.8,
    ease: "power2.inOut",
    onUpdate: () => {
      const n = Math.floor(o.p * final.length);
      let out = final.slice(0, n);
      for (let i = n; i < final.length; i++) {
        const c = final[i];
        out += c === " " ? " " : chars[(Math.random() * chars.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

/** Fraction (0–1) along `path` nearest to (x, y), sampled at 240 steps (reference fracOf). */
export function fracOf(path: SVGGeometryElement, len: number, x: number, y: number) {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i <= 240; i++) {
    const p = path.getPointAtLength((len * i) / 240);
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < bd) {
      bd = d;
      best = i / 240;
    }
  }
  return best;
}

/** Section markers: the line fills on scrub ("top 94%" → "top 55%"), number + label pop (back.out(2)). */
export function animateSectionMarks(scope: Element) {
  scope.querySelectorAll(".sec-mark").forEach((m) => {
    const line = m.querySelector(".sm-line i");
    if (line) {
      gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: m, start: "top 94%", end: "top 55%", scrub: 0.5 } });
    }
    gsap.from([m.querySelector(".sm-num"), m.querySelector(".sm-label")], {
      y: 18,
      autoAlpha: 0,
      duration: 0.7,
      ease: "back.out(2)",
      stagger: 0.08,
      scrollTrigger: { trigger: m, start: "top 92%", once: true },
    });
  });
}

export { gsap, ScrollTrigger };
