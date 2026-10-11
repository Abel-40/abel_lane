"use client";

import { useRef } from "react";
import { experience } from "@/content/experience";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { SectionMark } from "@/components/ui/SectionMark";
import { useWindingTimeline } from "./useWindingTimeline";

/** 04 — Where I’ve shipped. */
export function Experience() {
  const root = useRef<HTMLElement>(null);
  useWindingTimeline(root);

  return (
    <section className="xp-sec" aria-labelledby="xp-h" ref={root}>
      <div className="wrap">
        <SectionMark num="04" label="Experience" />
        <div className="xp-head">
          <h2 className="h2" id="xp-h">
            Where I’ve shipped.
          </h2>
          <div className="xp-head-side">
            <p>
              Each role pulled me further toward the backend, from wireframes to merchant dashboards to production AI
              services.
            </p>
            <TransitionLink href="/about" className="link-arrow">
              Full career log <Icon name="arrow" />
            </TransitionLink>
          </div>
        </div>
        <div className="xpw" id="xpw">
          <svg className="xpw-svg" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="xpGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000">
                <stop offset="0" className="jr-s1" />
                <stop offset="1" className="jr-s2" />
              </linearGradient>
            </defs>
            <path className="xpw-bg" d="M0 0" />
            <path className="xpw-path" d="M0 0" />
            <g className="xpw-links" />
            <g className="xpw-dots" />
            <circle className="xpw-halo" r="16" cx="-60" cy="-60" />
            <circle className="xpw-head" r="6" cx="-60" cy="-60" />
          </svg>
          <ol className="xpw-list">
            {experience.map((x, i) => (
              <li className={`xpw-row ${i % 2 ? "side-r" : "side-l"}`} key={x.period}>
                <div className="xpw-card">
                  <div className="xpw-top">
                    <span className="xpw-period">{x.period}</span>
                    {x.current && (
                      <span className="xpw-now">
                        <span className="pulse-dot" />
                        Current
                      </span>
                    )}
                  </div>
                  <h3 className="xpw-role">{x.role}</h3>
                  <span className="xpw-org">{x.org}</span>
                  <p className="xpw-note">{x.note}</p>
                  <ul className="chips">
                    {x.chips.map((c) => (
                      <li className="chip" key={c}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="xpw-year" aria-hidden="true">
                  {x.year}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
