"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { genericIcons, brandIcons, type GenericIconKey } from "@/content/icons";
import { toolGroups } from "@/content/stack";
import type { Tool, ToolGroupId } from "@/content/types";
import { rise } from "@/lib/anim";
import { Flip, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion";

type TabId = "all" | ToolGroupId;

const ALL = toolGroups.flatMap((g) => g.tools.map((t) => ({ ...t, g: g.id, gl: g.label })));
const TABS: { id: TabId; label: string; n: number }[] = [
  { id: "all", label: "All", n: ALL.length },
  ...toolGroups.map((g) => ({ id: g.id, label: g.label, n: g.tools.length })),
];

function ToolTile({ t }: { t: Tool & { g: ToolGroupId; gl: string } }) {
  const gen = t.icon.startsWith("g:");
  const L = gen ? null : brandIcons[t.icon];
  const cls = ["tool", gen ? "gen" : L?.k === "d" ? "b-d" : L?.k === "l" ? "b-l" : "", t.icon === "aws" ? "wide" : ""]
    .filter(Boolean)
    .join(" ");
  const style = !gen && L && L.k !== "d" ? ({ "--brand": L.h, "--on-brand": L.o } as React.CSSProperties) : undefined;
  return (
    <div className={cls} data-g={t.g} style={style}>
      <span className="tool-logo">
        {gen ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            dangerouslySetInnerHTML={{ __html: genericIcons[t.icon.slice(2) as GenericIconKey] }}
          />
        ) : (
          <svg viewBox={L!.v} aria-hidden="true" focusable="false">
            <path d={L!.d} />
          </svg>
        )}
      </span>
      <span className="tool-txt">
        <b>{t.name}</b>
        <small>{t.gl}</small>
      </span>
    </div>
  );
}

/** "Tools I ship with." — All + 6 category tabs with a sliding pill; Flip re-flows the board; cursor spotlight. */
export function ToolsBoard() {
  const root = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<TabId>("all");
  const flipState = useRef<Flip.FlipState | null>(null);
  const boardH = useRef(0);

  const placePill = useCallback(() => {
    const el = root.current;
    const on = el?.querySelector<HTMLElement>(".tab.on");
    const pill = el?.querySelector<HTMLElement>(".tab-pill");
    if (!on || !pill || !on.offsetParent) return;
    pill.style.width = `${on.offsetWidth}px`;
    pill.style.height = `${on.offsetHeight}px`;
    pill.style.transform = `translate(${on.offsetLeft}px,${on.offsetTop}px)`;
  }, []);

  useEffect(() => {
    placePill();
    window.addEventListener("resize", placePill);
    document.fonts?.ready.then(placePill);
    return () => window.removeEventListener("resize", placePill);
  }, [placePill]);

  /* entrance + spotlight */
  useGSAP(
    () => {
      const el = root.current!;
      const board = el.querySelector<HTMLElement>(".board")!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        rise(el.querySelectorAll(".stack-head, .tabs"), el);
        gsap.from(el.querySelectorAll(".tool"), {
          y: 34,
          scale: 0.88,
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.6)",
          stagger: { each: 0.028, from: "start" },
          scrollTrigger: { trigger: board, start: "top 85%", once: true },
        });
        if (!isFinePointer()) return;
        const onMove = (e: PointerEvent) => {
          const r = board.getBoundingClientRect();
          board.style.setProperty("--mx", `${e.clientX - r.left}px`);
          board.style.setProperty("--my", `${e.clientY - r.top}px`);
        };
        board.addEventListener("pointermove", onMove);
        return () => board.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  /* apply the filter after React commits the new tab, then Flip from the captured state */
  useLayoutEffect(() => {
    const el = root.current!;
    const board = el.querySelector<HTMLElement>(".board")!;
    const tiles = Array.from(board.querySelectorAll<HTMLElement>(".tool"));
    tiles.forEach((t) => (t.style.display = tab === "all" || t.dataset.g === tab ? "" : "none"));
    placePill();
    const state = flipState.current;
    flipState.current = null;
    if (!state) return;
    const h1 = board.offsetHeight;
    gsap.fromTo(board, { height: boardH.current }, { height: h1, duration: 0.6, ease: "power3.inOut", clearProps: "height" });
    Flip.from(state, {
      duration: 0.62,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.01,
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, scale: 0.6, y: 18 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.03, delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.6, duration: 0.32, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [tab, placePill]);

  const choose = (id: TabId, btn: HTMLButtonElement) => {
    if (id === tab) return;
    const board = root.current!.querySelector<HTMLElement>(".board")!;
    if (!prefersReducedMotion()) {
      flipState.current = Flip.getState(board.querySelectorAll(".tool"));
      boardH.current = board.offsetHeight;
    }
    const bar = btn.parentElement!;
    if (bar.scrollWidth > bar.clientWidth) {
      bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    setTab(id);
  };

  const shown = tab === "all" ? ALL.length : TABS.find((t) => t.id === tab)!.n;
  const label = TABS.find((t) => t.id === tab)!.label;

  return (
    <section className="wrap ab-stack" aria-labelledby="stack-h" ref={root}>
      <div className="stack-head">
        <h2 className="h2" id="stack-h">
          Tools I ship with.
        </h2>
        <span className="stack-count">
          {ALL.length} tools across {toolGroups.length} areas
        </span>
      </div>
      <div className="tabs" role="group" aria-label="Tool categories">
        <span className="tab-pill" aria-hidden="true" />
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={t.id === tab ? "tab on" : "tab"}
            aria-pressed={t.id === tab}
            onClick={(e) => choose(t.id, e.currentTarget)}
          >
            {t.label}
            <span className="n">{t.n}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {tab === "all" ? `Showing all ${shown} tools` : `Showing ${shown} ${label} tools`}
      </p>
      <div className="board">
        {ALL.map((t) => (
          <ToolTile t={t} key={t.name} />
        ))}
      </div>
    </section>
  );
}
