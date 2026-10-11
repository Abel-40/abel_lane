"use client";

import { useRef } from "react";
import { rise } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";

/** Facts row: "2+" counts up from 0, then Andela, AWS and UTC+3. */
export function Facts() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const facts = el.querySelector(".facts")!;
        rise(el.querySelectorAll(".fact"), facts);
        const cnt = el.querySelector<HTMLElement>(".count-to")!;
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
        <li className="fact">
          <b>
            <span className="count-to" data-to="2">
              2
            </span>
            +
          </b>
          <span>years of software and product experience</span>
        </li>
        <li className="fact">
          <b>Andela</b>
          <span>Backend Engineer, Oct 2025 to Jun 2026</span>
        </li>
        <li className="fact">
          <b>AWS</b>
          <span>Certified Cloud Practitioner</span>
        </li>
        <li className="fact">
          <b>UTC+3</b>
          <span>Based in Ethiopia, open to remote work</span>
        </li>
      </ul>
    </section>
  );
}
