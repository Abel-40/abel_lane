"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { history } from "@/content/history";
import { rise, splitChars } from "@/lib/anim";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";

const OPEN_BY_DEFAULT = 2; // the Andela entry, as in the reference

/** Place the rail between the first and last commit dots (reference fitRail / fitLogRail). */
function fitLogRail(wrap: HTMLElement) {
  const tl = wrap.querySelector<HTMLElement>(".tl");
  if (!tl || !wrap.offsetParent) return;
  const wr = wrap.getBoundingClientRect();
  const centers = Array.from(wrap.querySelectorAll(".c-dot")).map((d) => {
    const r = d.getBoundingClientRect();
    return r.top + r.height / 2 - wr.top;
  });
  if (!centers.length) return;
  const top = centers[0] - 26;
  const bottom = centers[centers.length - 1] + 26;
  tl.style.top = `${top}px`;
  tl.style.height = `${Math.max(0, bottom - top)}px`;
}

/**
 * `~/abel` terminal: types `$ git log --career`; each entry is a commit that expands to show its bullets;
 * a rail fills on scroll with a travelling head, and commits light up as they are passed.
 */
export function CareerLog() {
  const root = useRef<HTMLElement>(null);

  useIdleGSAP(
    () => {
      const el = root.current!;
      const wrap = el.querySelector<HTMLElement>(".commits-wrap")!;
      const fit = () => fitLogRail(wrap);
      fit();
      ScrollTrigger.addEventListener("refreshInit", fit);
      window.addEventListener("resize", fit);
      document.fonts?.ready.then(fit);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        rise(el.querySelectorAll(".ab-log > div:first-child > *"), el);
        const term = el.querySelector(".term")!;
        gsap
          .timeline({ scrollTrigger: { trigger: term, start: "top 80%", once: true } })
          .from(term, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out" })
          .from(splitChars(el.querySelector(".cmd-text")!, false).chars, { opacity: 0, duration: 0.01, stagger: 0.045 }, "-=.3")
          .from(el.querySelectorAll(".commit"), { x: -24, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 }, "+=.1");
        const logT = el.querySelector(".tl")!;
        gsap
          .timeline({ scrollTrigger: { trigger: logT, start: "top 70%", end: "bottom 70%", scrub: 0.5 } })
          .fromTo(logT.querySelector(".tl-fill"), { scaleY: 0 }, { scaleY: 1, ease: "none" }, 0)
          .fromTo(logT.querySelector(".tl-head"), { top: "0%", opacity: 1 }, { top: "100%", opacity: 1, ease: "none" }, 0);
        el.querySelectorAll(".commit").forEach((c) => {
          ScrollTrigger.create({ trigger: c, start: "top+=28 70%", end: "max", toggleClass: { targets: c, className: "lit" } });
        });
      });

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", fit);
        window.removeEventListener("resize", fit);
      };
    },
    { scope: root },
  );

  const toggle = (li: HTMLElement) => {
    const body = li.querySelector<HTMLElement>(".c-body")!;
    const head = li.querySelector<HTMLElement>(".commit-head")!;
    const open = !li.classList.contains("open");
    li.classList.toggle("open", open);
    head.setAttribute("aria-expanded", String(open));
    const wrap = root.current!.querySelector<HTMLElement>(".commits-wrap")!;
    const after = () => {
      fitLogRail(wrap);
      ScrollTrigger.refresh();
    };
    if (prefersReducedMotion()) {
      after();
      return;
    }
    if (open) {
      gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.5, ease: "power3.out", onComplete: after });
      gsap.from(body.querySelectorAll("li"), { x: -14, opacity: 0, duration: 0.45, stagger: 0.06, delay: 0.1 });
    } else {
      gsap.fromTo(body, { height: body.offsetHeight }, {
        height: 0,
        duration: 0.4,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(body, { clearProps: "height" });
          after();
        },
      });
    }
  };

  return (
    <section className="wrap ab-log" aria-labelledby="log-h" ref={root}>
      <div>
        <h2 className="h2" id="log-h">
          The career log.
        </h2>
        <p className="lead">Every role pulled me further toward the backend. Open an entry to see what I did there.</p>
      </div>
      <div className="term">
        <div className="term-bar">
          <span className="term-dots">
            <span />
            <span />
            <span />
          </span>
          ~/abel
        </div>
        <p className="term-cmd">
          <span className="pr" aria-hidden="true">$</span> <span className="sr-only">git log --career</span>
          <span className="cmd-text" aria-hidden="true">
            git log --career
          </span>
          <span className="caret" />
        </p>
        <div className="commits-wrap">
          <span className="tl" aria-hidden="true">
            <span className="tl-track">
              <i className="tl-fill" />
            </span>
            <span className="tl-head" />
          </span>
          <ol className="commits">
            {history.map((h, i) => {
              const open = i === OPEN_BY_DEFAULT;
              return (
                <li className={open ? "commit open" : "commit"} key={h.period + h.label}>
                  <button
                    type="button"
                    className="commit-head"
                    aria-expanded={open}
                    aria-controls={`cb-${i}`}
                    onClick={(e) => toggle(e.currentTarget.closest(".commit") as HTMLElement)}
                  >
                    <span className="c-dot" />
                    <span>
                      <span className="c-meta">
                        {h.period}
                        {h.head && <span className="c-head-tag">HEAD → main</span>}
                      </span>
                      <span className="c-title">{h.label}</span>
                      <span className="c-org">{h.org}</span>
                    </span>
                    <Icon name="chev" className="chev" />
                  </button>
                  <div className="c-body" id={`cb-${i}`}>
                    <ul>
                      {h.items.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
