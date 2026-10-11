"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { aboutContent } from "@/content";
import { rise } from "@/lib/anim";
import { gsap } from "@/lib/gsap";

/** Facts row from data/about.json; a fact with `countTo` counts up from 0 when it scrolls in. */
export function Facts() {
  const root = useRef<HTMLElement>(null);
  useIdleGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const facts = el.querySelector(".facts")!;
        rise(el.querySelectorAll(".fact"), facts);
        const cnt = el.querySelector<HTMLElement>(".count-to");
        if (!cnt) return;
        const o = { v: 0 };
        cnt.textContent = "0";
        gsap.to(o, {
          v: Number(cnt.dataset.to),
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => void (cnt.textContent = String(Math.round(o.v))),
          scrollTrigger: { trigger: facts, start: "top 86%", once: true },
        });
        return () => void (cnt.textContent = cnt.dataset.to ?? "2");
      });
    },
    { scope: root },
  );
  return (
    <section className="wrap" ref={root}>
      <ul className="facts">
        {aboutContent.facts.map((f) => (
          <li className="fact" key={f.label}>
            <b>
              {f.countTo != null ? (
                <>
                  <span className="count-to" data-to={f.countTo}>
                    {f.countTo}
                  </span>
                  {f.value.replace(String(f.countTo), "")}
                </>
              ) : (
                f.value
              )}
            </b>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
