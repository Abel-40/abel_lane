"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { releaseIntro } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";

export const LOADER_KEY = "abel-loader-seen";

/**
 * First-load terminal loader (reference runLoader). Shown once per session and skipped under reduced
 * motion; the pre-paint script hides it before first paint when it won't run. A click, any key or the
 * Skip button speeds it up ×4 (polish D2). Page intros wait for the 1.85s mark via the intro gate.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    if (html.dataset.loader === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      releaseIntro();
      setGone(true);
      return;
    }
    el.classList.add("js-run");
    lockScroll(true);
    const count = el.querySelector<HTMLElement>(".loader-count")!;
    const bar = el.querySelector<HTMLElement>(".loader-bar span")!;
    const o = { v: 0 };
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem(LOADER_KEY, "1");
      } catch {
        /* storage can be unavailable (private mode); the loader just shows again next time */
      }
      html.dataset.loader = "off";
      lockScroll(false);
      setGone(true);
    };
    // Built entirely inside a context so cleanup (unmount, StrictMode double-invoke) reverts it;
    // fromTo with explicit end values never reads a half-animated DOM as its target.
    let tl!: gsap.core.Timeline;
    const ctx = gsap.context(() => {
      tl = gsap
        .timeline({ onComplete: finish })
        .fromTo(".ll", { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out", stagger: 0.2 }, 0.05)
        .to(
          o,
          {
            v: 100,
            duration: 1.3,
            ease: "power2.inOut",
            onUpdate: () => {
              count.textContent = String(Math.round(o.v)).padStart(3, "0");
              bar.style.transform = `scaleX(${o.v / 100})`;
            },
          },
          0,
        )
        .to(".loader-inner", { y: -30, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 1.4)
        .to(".loader-skip", { autoAlpha: 0, duration: 0.2 }, 1.4)
        .to(".lp-top", { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, 1.62)
        .to(".lp-bot", { yPercent: 100, duration: 0.85, ease: "expo.inOut" }, 1.62)
        .call(releaseIntro, [], 1.85);
    }, el);
    const speed = () => tl.timeScale(4);
    el.addEventListener("click", speed);
    window.addEventListener("keydown", speed);
    return () => {
      el.removeEventListener("click", speed);
      window.removeEventListener("keydown", speed);
      if (!finished) {
        ctx.revert();
        lockScroll(false);
        releaseIntro();
      }
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" id="loader" ref={root}>
      <div className="lp lp-top" aria-hidden="true" />
      <div className="lp lp-bot" aria-hidden="true" />
      <div className="loader-inner" aria-hidden="true">
        <ul className="loader-log">
          <li className="ll"><span className="pr">$</span> abel serve --env production</li>
          <li className="ll"><span className="ok">✓</span> FastAPI services up</li>
          <li className="ll"><span className="ok">✓</span> Celery workers ready</li>
          <li className="ll"><span className="ok">✓</span> pgvector index loaded</li>
          <li className="ll"><span className="ok">✓</span> Listening</li>
        </ul>
        <div className="loader-count">000</div>
        <div className="loader-bar"><span /></div>
      </div>
      <button type="button" className="loader-skip">Skip intro</button>
    </div>
  );
}
