"use client";

import { useRef } from "react";
import { marqueeRows } from "@/content/marquee";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const Star = () => (
  <svg className="mq-star" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9-7.9-2.6 7.9-2.6z" />
  </svg>
);

/**
 * Two rows of tech names (second outlined) running in opposite directions forever (42s loop).
 * Scroll velocity speeds them up to ×7, flips direction with the scroll and skews ±12°, then settles.
 * Static under reduced motion; paused offscreen.
 */
export function Marquee() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tracks = gsap.utils.toArray<HTMLElement>(".mq-track", root.current);
        const tw = tracks.map((tr, i) => {
          const left = i === 0;
          const t = gsap.fromTo(tr, { xPercent: left ? 0 : -50 }, { xPercent: left ? -50 : 0, duration: 42, ease: "none", repeat: -1 });
          t.totalTime(t.duration() * 200); // start mid-loop so reversing never hits time 0
          return t;
        });
        let dir = 1;
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => tw.forEach((t) => (self.isActive ? t.resume() : t.pause())),
          onUpdate: (self) => {
            const v = self.getVelocity();
            dir = self.direction || dir;
            const boost = 1 + Math.min(Math.abs(v) / 380, 6);
            tw.forEach((t) => gsap.to(t, { timeScale: boost * dir, duration: 0.2, overwrite: true }));
            gsap.to(tracks, { skewX: gsap.utils.clamp(-12, 12, -v / 220), duration: 0.3, overwrite: "auto" });
          },
        });
        const settle = () => {
          tw.forEach((t) => gsap.to(t, { timeScale: dir, duration: 1.2, overwrite: true }));
          gsap.to(tracks, { skewX: 0, duration: 0.7, overwrite: "auto" });
        };
        ScrollTrigger.addEventListener("scrollEnd", settle);
        return () => {
          st.kill();
          ScrollTrigger.removeEventListener("scrollEnd", settle);
        };
      });
    },
    { scope: root },
  );

  return (
    <section className="mq" aria-hidden="true" ref={root}>
      {marqueeRows.map((row, i) => (
        <div className="mq-row" key={i}>
          <div className="mq-track">
            {[0, 1].map((copy) =>
              row.map((t) => (
                <span className="mq-item" key={`${copy}-${t}`}>
                  {t}
                  <Star />
                </span>
              )),
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
