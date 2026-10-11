"use client";

import { useRef } from "react";
import { journeyNodes, journeyStages } from "@/content/journey";
import type { UiIconKey } from "@/content/icons";
import { pad2 } from "@/lib/motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { SectionMark } from "@/components/ui/SectionMark";
import { usePinnedJourney } from "./usePinnedJourney";

const STEPS = ["User", "API", "Database", "Knowledge", "AI", "Response"];
/** Technologies along the path. `brand` is a key in icons.json › brands; pgvector has no brand mark, so it uses the vector glyph. */
const STACK: { name: string; note: string; brand?: string; color?: string }[] = [
  { name: "FastAPI", note: "Typed Python APIs", brand: "fastapi", color: "#009688" },
  { name: "PostgreSQL", note: "Relational data", brand: "postgresql", color: "#4169E1" },
  { name: "pgvector", note: "Vectors in Postgres", color: "#5B6CFF" },
  { name: "Qdrant", note: "Vector database", brand: "qdrant", color: "#DC244C" },
  { name: "Redis", note: "Cache and queue broker", brand: "redis", color: "#DC382D" },
  { name: "Celery", note: "Background jobs", brand: "celery", color: "#37814A" },
  { name: "Gemini", note: "LLM reasoning", brand: "googlegemini", color: "#4285F4" },
];
const BG_PATHS = [
  "M80 90 H360",
  "M360 90 C395 90 405 36 440 36 H460 C495 36 525 90 560 90",
  "M360 90 C395 90 405 144 440 144 H460 C495 144 525 90 560 90",
  "M560 90 C626 90 626 310 560 310 H80",
];

/** 02 — How a request moves through the systems I build. */
export function Journey() {
  const root = useRef<HTMLElement>(null);
  usePinnedJourney(root);
  const s0 = journeyStages[0];

  return (
    <section className="journey" aria-labelledby="jr-h" ref={root}>
      <div className="jr-pin">
        <div className="jr-band">
          <span className="jr-aura a1" aria-hidden="true" />
          <span className="jr-aura a2" aria-hidden="true" />
          <span className="jr-aura a3" aria-hidden="true" />
          <div className="jr-head">
            <SectionMark num="02" label="How it works" />
            <h2 className="h2" id="jr-h">
              How a request moves through the systems I build.
            </h2>
            <p className="lead">
              Most AI features share one shape. A request comes in, the backend finds the right data, the model reasons
              over it, and a grounded answer goes back. Scroll to follow one.
            </p>
          </div>
          {/* Visual walkthrough; the same six stages are in the list below for screen readers. */}
          <div className="jr-grid" aria-hidden="true">
            <div className="jr-panel">
              <div className="jr-top">
                <span className="jr-req">
                  <span className="verb">POST</span>/v1/ask
                </span>
                <span className="jr-state">
                  <span className="pulse-dot" />
                  <span className="jr-state-t">{s0.state}</span>
                </span>
              </div>
              <div className="jr-n">
                <span className="jr-cur">01</span>
                <small> / 06</small>
              </div>
              <h3 className="jr-title">{s0.title}</h3>
              <p className="jr-desc">{s0.desc}</p>
              <span className="chip jr-tech">{s0.tech}</span>
              <div className="jr-code">
                <span className="jr-code-k">
                  Example payload <i className="jr-code-s">stage 1 of 6</i>
                </span>
                <pre className="jr-pre">{s0.code}</pre>
              </div>
              <div className="jr-meter">
                <span />
              </div>
            </div>
            <div className="jr-stage">
              <ol className="jr-steps">
                {STEPS.map((s, i) => (
                  <li key={s} className={i === 0 ? "now" : undefined}>
                    <i>{i + 1}</i>
                    {s}
                  </li>
                ))}
              </ol>
              <div className="jr-diagram">
                <svg viewBox="0 0 640 400">
                  <defs>
                    <linearGradient id="jrGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="640" y2="0">
                      <stop offset="0" className="jr-s1" />
                      <stop offset="1" className="jr-s2" />
                    </linearGradient>
                  </defs>
                  <g className="jr-bg">
                    {BG_PATHS.map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </g>
                  <path className="jr-path" data-seg="s1" d={BG_PATHS[0]} />
                  <path className="jr-path" data-seg="la" d={BG_PATHS[1]} />
                  <path className="jr-path lane-b" data-seg="lb" d={BG_PATHS[2]} />
                  <path className="jr-path" data-seg="s2" d={BG_PATHS[3]} />
                  <path className="jr-async" d="M255 116 V174" />
                  <circle className="jr-junc" cx="360" cy="90" r="5" />
                  <circle className="jr-junc" cx="560" cy="90" r="5" />
                  {(["a", "b"] as const).flatMap((t) =>
                    [1, 2, 3, 4].map((k) => (
                      <circle
                        key={`${t}${k}`}
                        className={t === "b" ? "jr-trail b" : "jr-trail"}
                        data-t={t}
                        r={5 - k * 0.8}
                        opacity="0"
                        cx="80"
                        cy="90"
                      />
                    )),
                  )}
                  <circle className="jr-halo" cx="80" cy="90" r="16" />
                  <circle className="jr-packet" cx="80" cy="90" r="6" />
                  <circle className="jr-packet b" cx="360" cy="90" r="5" opacity="0" />
                </svg>
                <div>
                  {journeyNodes.map((n) => (
                    <div
                      key={n.k}
                      className={n.side ? "jr-node side" : "jr-node"}
                      style={{ "--x": n.x, "--y": n.y } as React.CSSProperties}
                      data-s={n.s}
                      data-k={n.k}
                    >
                      <span className="ring" />
                      <span className="ni">
                        <Icon name={n.ic as UiIconKey} />
                      </span>
                      <span>
                        <b>{n.node}</b>
                        <small>{n.sub}</small>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="jr-chip" />
                <div className="jr-chip b" />
              </div>
            </div>
          </div>
          <div className="jr-stack" aria-hidden="true">
            <span className="jr-stack-k">
              <Icon name="spark" />
              Technologies I use
            </span>
            <ul>
              {STACK.map((t) => (
                <li key={t.name} style={{ "--brand": t.color } as React.CSSProperties}>
                  <span className="jr-stack-ic">{t.brand ? <BrandLogo name={t.brand} /> : <Icon name="vec" />}</span>
                  <span>
                    <b>{t.name}</b>
                    <small>{t.note}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <ol className="jr-list">
            {journeyStages.map((s, i) => (
              <li key={s.title}>
                <span className="jl-n">{pad2(i + 1)}</span>
                <div>
                  <h3 className="jl-t">{s.title}</h3>
                  <p className="jl-d">{s.desc}</p>
                  <span className="chip">{s.tech}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
