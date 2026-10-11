"use client";

import type { RefObject } from "react";
import { animateSectionMarks, fracOf, rise } from "@/lib/anim";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { MQ } from "@/lib/motion";

const NS = "http://www.w3.org/2000/svg";

interface XpGeometry {
  path: SVGPathElement;
  L: number;
  rows: HTMLElement[];
  dots: SVGCircleElement[];
  rings: SVGCircleElement[];
  links: (SVGPathElement & { __len?: number })[];
  fr: number[];
  head: SVGCircleElement;
  halo: SVGCircleElement;
}

/** Builds the winding spine from the card positions (reference buildXpPath). */
function buildXpPath(wrap: HTMLElement): XpGeometry | null {
  if (!wrap.offsetParent) return null;
  const svg = wrap.querySelector<SVGSVGElement>(".xpw-svg")!;
  const list = wrap.querySelector<HTMLElement>(".xpw-list")!;
  const rows = Array.from(wrap.querySelectorAll<HTMLElement>(".xpw-row"));
  if (!rows.length) return null;
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  const mobile = window.matchMedia("(max-width: 899.98px)").matches;
  const cx = mobile ? 20 : W / 2;
  const amp = mobile ? 8 : 36;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.querySelector("linearGradient")?.setAttribute("y2", String(H));
  const pts: { x: number; y: number }[] = [];
  const links: { x1: number; x2: number; y: number }[] = [];
  rows.forEach((r, i) => {
    const card = r.querySelector<HTMLElement>(".xpw-card")!;
    const top = list.offsetTop + card.offsetTop;
    const left = list.offsetLeft + card.offsetLeft;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const y = top + Math.min(36, h / 2);
    const leftSide = r.classList.contains("side-l");
    const ax = mobile ? (i % 2 ? cx + amp : cx - amp) : leftSide ? cx - amp : cx + amp;
    const edge = mobile ? left : leftSide ? left + w : left;
    pts.push({ x: ax, y });
    links.push({ x1: ax, x2: edge, y });
  });
  const y0 = Math.max(4, pts[0].y - 40);
  const yN = Math.min(H - 4, pts[pts.length - 1].y + 40);
  let d = `M${cx} ${y0}`;
  let px = cx;
  let py = y0;
  [...pts, { x: cx, y: yN }].forEach((q) => {
    const k = (q.y - py) * 0.5;
    d += ` C${px.toFixed(1)} ${(py + k).toFixed(1)} ${q.x.toFixed(1)} ${(q.y - k).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    px = q.x;
    py = q.y;
  });
  const path = svg.querySelector<SVGPathElement>(".xpw-path")!;
  path.setAttribute("d", d);
  svg.querySelector(".xpw-bg")!.setAttribute("d", d);
  const gL = svg.querySelector(".xpw-links")!;
  const gD = svg.querySelector(".xpw-dots")!;
  gL.textContent = "";
  gD.textContent = "";
  const linkEls = links.map((l) => {
    const el = document.createElementNS(NS, "path") as SVGPathElement & { __len?: number };
    el.setAttribute("class", "xpw-link");
    el.setAttribute("d", `M${l.x1.toFixed(1)} ${l.y.toFixed(1)} H${l.x2.toFixed(1)}`);
    const len = Math.abs(l.x2 - l.x1);
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.__len = len;
    gL.appendChild(el);
    return el;
  });
  const rings: SVGCircleElement[] = [];
  const dots = pts.map((q) => {
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "xpw-ring");
    ring.setAttribute("cx", String(q.x));
    ring.setAttribute("cy", String(q.y));
    ring.setAttribute("r", "8");
    gD.appendChild(ring);
    rings.push(ring);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "xpw-dot");
    c.setAttribute("cx", String(q.x));
    c.setAttribute("cy", String(q.y));
    c.setAttribute("r", "8");
    gD.appendChild(c);
    return c;
  });
  const L = path.getTotalLength();
  rows.forEach((r) => r.classList.remove("lit"));
  return {
    path,
    L,
    rows,
    dots,
    rings,
    links: linkEls,
    fr: pts.map((q) => fracOf(path, L, q.x, q.y)),
    head: svg.querySelector(".xpw-head")!,
    halo: svg.querySelector(".xpw-halo")!,
  };
}

function allLit(g: XpGeometry | null) {
  if (!g) return;
  g.path.style.strokeDasharray = "";
  g.path.style.strokeDashoffset = "";
  // no travelling head when everything is already lit
  g.head.style.display = "none";
  g.halo.style.display = "none";
  g.rows.forEach((r, i) => {
    r.classList.add("lit");
    g.dots[i].classList.add("on");
    g.links[i].style.strokeDashoffset = "0";
  });
}

/**
 * 04 — winding timeline (reference "experience" block). Scroll draws the line; a white head with a pulsing
 * halo travels it; each dot lights, its connector draws and a ring bursts; a card appears only when the head
 * reaches its dot and hides again on scroll-up. Reduced motion: fully lit, all cards visible.
 */
export function useWindingTimeline(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const el = rootRef.current!;
      const wrap = el.querySelector<HTMLElement>(".xpw")!;
      const mm = gsap.matchMedia();

      mm.add(MQ.reduce, () => {
        const build = () => allLit(buildXpPath(wrap));
        const id = requestAnimationFrame(build);
        window.addEventListener("resize", build);
        document.fonts?.ready.then(build);
        return () => {
          cancelAnimationFrame(id);
          window.removeEventListener("resize", build);
        };
      });

      mm.add({ desk: MQ.desktop, mob: MQ.mobile }, (ctx) => {
        const desk = !!ctx.conditions?.desk;
        animateSectionMarks(el);
        rise(el.querySelectorAll(".xp-head > *"), el.querySelector(".xp-head"));
        let xg = buildXpPath(wrap);
        const xs = { p: 0 };
        const parts = Array.from(el.querySelectorAll<HTMLElement>(".xpw-row")).map((r) => {
          const left = r.classList.contains("side-l");
          const card = r.querySelector<HTMLElement>(".xpw-card")!;
          return {
            card,
            bits: Array.from(card.children),
            year: r.querySelector<HTMLElement>(".xpw-year"),
            dx: desk ? (left ? 56 : -56) : -28,
            rot: desk ? (left ? 3 : -3) : 0,
          };
        });
        parts.forEach((q) => {
          gsap.set(q.card, {
            autoAlpha: 0,
            x: q.dx,
            rotation: q.rot,
            scale: 0.9,
            transformOrigin: desk ? (q.dx > 0 ? "100% 30%" : "0% 30%") : "0% 30%",
          });
          gsap.set(q.bits, { autoAlpha: 0, y: 12 });
          if (desk && q.year) gsap.set(q.year, { autoAlpha: 0, x: -q.dx * 0.8 });
        });
        const show = (i: number, on: boolean) => {
          const q = parts[i];
          if (!q) return;
          if (on) {
            gsap.to(q.card, { autoAlpha: 1, x: 0, rotation: 0, scale: 1, duration: 0.75, delay: 0.12, ease: "back.out(1.5)", overwrite: true });
            gsap.to(q.bits, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.26, stagger: 0.06, ease: "power3.out", overwrite: true });
            if (desk && q.year) gsap.to(q.year, { autoAlpha: 1, x: 0, duration: 0.9, delay: 0.2, ease: "power3.out", overwrite: true });
          } else {
            gsap.to(q.card, { autoAlpha: 0, x: q.dx * 0.6, rotation: q.rot * 0.6, scale: 0.94, duration: 0.35, ease: "power2.in", overwrite: true });
            gsap.to(q.bits, { autoAlpha: 0, y: 12, duration: 0.25, ease: "power2.in", overwrite: true });
            if (desk && q.year) gsap.to(q.year, { autoAlpha: 0, x: -q.dx * 0.5, duration: 0.3, ease: "power2.in", overwrite: true });
          }
        };
        const render = (pr: number) => {
          if (!xg) return;
          xg.path.style.strokeDasharray = String(xg.L);
          xg.path.style.strokeDashoffset = String(xg.L * (1 - pr));
          const pt = xg.path.getPointAtLength(xg.L * pr);
          xg.head.setAttribute("cx", pt.x.toFixed(1));
          xg.head.setAttribute("cy", pt.y.toFixed(1));
          xg.halo.setAttribute("cx", pt.x.toFixed(1));
          xg.halo.setAttribute("cy", pt.y.toFixed(1));
          const g = xg;
          g.rows.forEach((r, i) => {
            const on = pr + 0.003 >= g.fr[i];
            if (r.classList.contains("lit") === on) return;
            r.classList.toggle("lit", on);
            g.dots[i].classList.toggle("on", on);
            g.links[i].style.strokeDashoffset = on ? "0" : String(g.links[i].__len);
            show(i, on);
            if (on) gsap.fromTo(g.rings[i], { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 30 }, opacity: 0, duration: 1, ease: "power2.out" });
          });
        };
        /* rebuild on refresh (resize, fonts) without replaying reveals */
        const rebuild = () => {
          const was = xg ? xg.rows.map((r) => r.classList.contains("lit")) : [];
          xg = buildXpPath(wrap);
          if (!xg) return;
          const g = xg;
          g.rows.forEach((r, i) => {
            if (was[i]) {
              r.classList.add("lit");
              g.dots[i].classList.add("on");
              g.links[i].style.strokeDashoffset = "0";
            }
          });
          render(xs.p);
        };
        ScrollTrigger.addEventListener("refreshInit", rebuild);
        render(0);
        gsap.to(xs, {
          p: 1,
          ease: "none",
          onUpdate: () => render(xs.p),
          scrollTrigger: { trigger: wrap, start: "top 74%", end: "bottom 66%", scrub: 0.5 },
        });
        gsap.to(el.querySelector(".xpw-halo"), { attr: { r: 24 }, opacity: 0.08, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut" });
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", rebuild);
          parts.forEach((q) => {
            const t = [q.card, q.year, ...q.bits].filter(Boolean) as Element[];
            gsap.killTweensOf(t);
            gsap.set(t, { clearProps: "all" });
          });
        };
      });
    },
    { scope: rootRef },
  );
}
