"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import type { RefObject } from "react";
import { journeyNodes, journeyStages } from "@/content/journey";
import { uiIcons, type UiIconKey } from "@/content/icons";
import { animateSectionMarks, fracOf, rise } from "@/lib/anim";
import { gsap } from "@/lib/gsap";
import { MQ, pad2 } from "@/lib/motion";
import { uiStore } from "@/lib/ui-store";

/* Request journey (reference "journey" block). Desktop: the band pins for 2.8 viewport heights (scrub .6)
   while paths draw, packets travel (lane B rides the second lane), junctions and nodes light up, a data
   tag rides above the packet and the panel re-types each stage. Mobile: the stage list rises in. */

const icoHTML = (k: UiIconKey) =>
  `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${uiIcons[k]}</svg>`;

/** What the request is carrying, by journey progress (reference CH table). */
const CH: Record<string, [UiIconKey, string]> = {
  json: ["braces", "JSON"],
  query: ["search", "query"],
  sql: ["db", "SQL"],
  emb: ["vec", "embed"],
  rows: ["db", "rows"],
  topk: ["vec", "top-k"],
  res: ["layers", "results"],
  ctx: ["doc", "context"],
  tok: ["spark", "tokens"],
  ok: ["check", "200 OK"],
};

/** Write stage `i` into the panel (reference setJourneyPanel). */
export function setJourneyPanel(root: Element, i: number) {
  const st = journeyStages[i];
  const set = (sel: string, text: string) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = text;
  };
  set(".jr-cur", pad2(i + 1));
  set(".jr-title", st.title);
  set(".jr-desc", st.desc);
  set(".jr-tech", st.tech);
  set(".jr-pre", st.code);
  set(".jr-state-t", st.state);
  set(".jr-code-s", `stage ${i + 1} of 6`);
  root.querySelectorAll(".jr-steps li").forEach((li, k) => {
    li.classList.toggle("done", k < i);
    li.classList.toggle("now", k === i);
  });
  // technologies used at this stage light up in the strip below
  let any = false;
  root.querySelectorAll<HTMLElement>(".jr-stack li").forEach((li) => {
    const on = (li.dataset.st ?? "").split(" ").includes(String(i));
    li.classList.toggle("on", on);
    any ||= on;
  });
  root.querySelector(".jr-stack")?.classList.toggle("has-on", any);
}

export function usePinnedJourney(rootRef: RefObject<HTMLElement | null>) {
  useIdleGSAP(
    () => {
      const el = rootRef.current!;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        animateSectionMarks(el);
        rise(el.querySelectorAll(".jr-head > .h2, .jr-head > .lead"), el.querySelector(".jr-head"));
      });

      mm.add(MQ.mobile, () => {
        rise(el.querySelectorAll(".jr-list li"), el.querySelector(".jr-list"), { stagger: 0.1 });
      });

      mm.add(MQ.desktop, () => {
        const band = el.querySelector<HTMLElement>(".jr-band")!;
        gsap.fromTo(band, { scale: 0.93, borderRadius: 60 }, {
          scale: 1,
          borderRadius: 34,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: true },
        });

        const jpin = el.querySelector<HTMLElement>(".jr-pin")!;
        const jsv = el.querySelector<SVGSVGElement>(".jr-diagram > svg")!;
        const seg: Record<string, { el: SVGPathElement; len: number }> = {};
        jsv.querySelectorAll<SVGPathElement>(".jr-path").forEach((pe) => {
          const L = pe.getTotalLength();
          seg[pe.dataset.seg!] = { el: pe, len: L };
          pe.style.strokeDasharray = String(L);
          pe.style.strokeDashoffset = String(L);
        });
        const A = 0.2;
        const B = 0.46;
        const cl = (v: number) => Math.max(0, Math.min(1, v));
        const jnodes = Array.from(el.querySelectorAll<HTMLElement>(".jr-node"));
        const juncs = Array.from(jsv.querySelectorAll<SVGCircleElement>(".jr-junc"));
        const pa = jsv.querySelector<SVGCircleElement>(".jr-packet:not(.b)")!;
        const pb = jsv.querySelector<SVGCircleElement>(".jr-packet.b")!;
        const jh = jsv.querySelector<SVGCircleElement>(".jr-halo")!;
        const trA = Array.from(jsv.querySelectorAll<SVGCircleElement>('.jr-trail[data-t="a"]'));
        const trB = Array.from(jsv.querySelectorAll<SVGCircleElement>('.jr-trail[data-t="b"]'));
        const jasync = jsv.querySelector(".jr-async")!;
        const at = (sg: { el: SVGPathElement; len: number }, t: number) => sg.el.getPointAtLength(sg.len * cl(t));
        const pos = (q: number): [DOMPoint, DOMPoint | null] => {
          if (q <= A) return [at(seg.s1, q / A), null];
          if (q <= B) {
            const t2 = (q - A) / (B - A);
            return [at(seg.la, t2), at(seg.lb, t2)];
          }
          return [at(seg.s2, (q - B) / (1 - B)), null];
        };
        const put = (c: SVGCircleElement, pt: DOMPoint) => {
          c.setAttribute("cx", pt.x.toFixed(1));
          c.setAttribute("cy", pt.y.toFixed(1));
        };
        const thr = [
          0,
          ((255 - 80) / (360 - 80)) * A,
          A + 0.5 * (B - A),
          B + fracOf(seg.s2.el, seg.s2.len, 450, 310) * (1 - B),
          B + fracOf(seg.s2.el, seg.s2.len, 265, 310) * (1 - B),
          1,
        ];
        const meter = el.querySelector<HTMLElement>(".jr-meter span")!;
        const pre = el.querySelector<HTMLElement>(".jr-pre")!;

        /* data tags riding on the packets */
        const jdiag = el.querySelector<HTMLElement>(".jr-diagram")!;
        const jchips = [el.querySelector<HTMLElement>(".jr-chip:not(.b)")!, el.querySelector<HTMLElement>(".jr-chip.b")!];
        const chipKey = ["", ""];
        const chipFor = (q: number, lane: number) => {
          if (q < thr[1]) return "json";
          if (q < A) return "query";
          if (q < thr[2]) return lane ? "emb" : "sql";
          if (q < B) return lane ? "topk" : "rows";
          if (q < thr[3]) return "res";
          if (q < thr[4]) return "ctx";
          if (q < 0.975) return "tok";
          return "ok";
        };
        const npts = journeyNodes.filter((n) => !n.side).map((n) => [n.x, n.y]);
        const placeChip = (i: number, pt: DOMPoint | null, q: number, show: boolean, sx: number) => {
          const c = jchips[i];
          if (!c) return;
          if (!show || !pt) {
            c.style.opacity = "0";
            return;
          }
          const k = chipFor(q, i);
          if (k !== chipKey[i]) {
            const popIt = chipKey[i] !== "";
            chipKey[i] = k;
            c.innerHTML = `<span class="jc-i">${icoHTML(CH[k][0])}</span><span class="jc-t">${CH[k][1]}</span>`;
            if (popIt) gsap.fromTo(c.firstChild, { scale: 0.3, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.6)" });
          }
          let d = 1e9;
          npts.forEach((n) => {
            const dx = pt.x - n[0];
            const dy = pt.y - n[1];
            d = Math.min(d, Math.sqrt(dx * dx + dy * dy));
          });
          const end = cl((q - 0.955) / 0.03);
          let sv = Math.max(cl((d - 44) / 30), end);
          if (i === 1) sv *= Math.min(cl((q - A) / ((B - A) * 0.18)), cl((B - q) / ((B - A) * 0.4) - 0.15));
          if (q < 0.006) sv = 0;
          const off = 13 + 26 * end;
          c.style.opacity = sv.toFixed(2);
          c.style.transform = `translate(${(pt.x * sx).toFixed(1)}px,${(pt.y * sx).toFixed(1)}px) translate(-50%, calc(-100% - ${off.toFixed(1)}px)) scale(${(0.55 + 0.45 * sv).toFixed(3)})`;
        };

        /* stage panel: text out → swap → in, payload types out */
        const txt = [el.querySelector(".jr-title"), el.querySelector(".jr-desc"), el.querySelector(".jr-tech")];
        let active = -1;
        let ptl: gsap.core.Timeline | null = null;
        let typeTw: gsap.core.Tween | null = null;
        const typeOut = (text: string) => {
          typeTw?.kill();
          const o = { n: 0 };
          typeTw = gsap.to(o, {
            n: text.length,
            duration: Math.min(0.9, text.length * 0.012),
            ease: "none",
            onUpdate: () => {
              const n = Math.round(o.n);
              pre.textContent = text.slice(0, n) + (n < text.length ? "▍" : "");
            },
            onComplete: () => {
              pre.textContent = text;
            },
          });
        };
        const setStage = (i: number) => {
          if (i === active) return;
          const first = active < 0;
          active = i;
          ptl?.kill();
          if (first) {
            setJourneyPanel(el, i);
            return;
          }
          const stg = journeyStages[i];
          ptl = gsap
            .timeline()
            .to(txt, { y: -12, opacity: 0, duration: 0.15, stagger: 0.03, ease: "power2.in" })
            .add(() => {
              setJourneyPanel(el, i);
              pre.textContent = "";
              typeOut(stg.code);
            })
            .fromTo(txt, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, stagger: 0.04, ease: "power3.out" })
            .fromTo(el.querySelector(".jr-cur"), { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, "<")
            .fromTo(el.querySelector(".jr-state"), { scale: 0.9 }, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, "<");
          jnodes.forEach((n) => {
            if (Number(n.dataset.s) === i) {
              gsap.fromTo(n.querySelector(".ring"), { scale: 0.9, opacity: 0.9 }, { scale: 1.35, opacity: 0, duration: 0.9, ease: "power2.out" });
            }
          });
        };

        const render = (q: number) => {
          seg.s1.el.style.strokeDashoffset = String(seg.s1.len * (1 - cl(q / A)));
          const tl2 = cl((q - A) / (B - A));
          seg.la.el.style.strokeDashoffset = String(seg.la.len * (1 - tl2));
          seg.lb.el.style.strokeDashoffset = String(seg.lb.len * (1 - tl2));
          seg.s2.el.style.strokeDashoffset = String(seg.s2.len * (1 - cl((q - B) / (1 - B))));
          const cur = pos(q);
          put(pa, cur[0]);
          put(jh, cur[0]);
          if (cur[1]) {
            put(pb, cur[1]);
            pb.setAttribute("opacity", "1");
          } else pb.setAttribute("opacity", "0");
          const jsx = jdiag.clientWidth / 640;
          placeChip(0, cur[0], q, true, jsx);
          placeChip(1, cur[1], q, !!cur[1], jsx);
          for (let k = 1; k <= 4; k++) {
            const back = pos(Math.max(0, q - k * 0.011));
            const op = q > 0.002 ? (0.55 - k * 0.12).toFixed(2) : "0";
            put(trA[k - 1], back[0]);
            trA[k - 1].setAttribute("opacity", op);
            if (cur[1] && back[1]) {
              put(trB[k - 1], back[1]);
              trB[k - 1].setAttribute("opacity", op);
            } else trB[k - 1].setAttribute("opacity", "0");
          }
          jasync.classList.toggle("on", q + 0.004 >= thr[1]);
          juncs[0].classList.toggle("on", q >= A - 0.002);
          juncs[1].classList.toggle("on", q >= B - 0.002);
          let a = 0;
          thr.forEach((f, i) => {
            if (q + 0.004 >= f) a = i;
          });
          jnodes.forEach((n) => {
            const sIdx = Number(n.dataset.s);
            n.classList.toggle("on", sIdx <= a);
            n.classList.toggle("now", sIdx === a);
          });
          meter.style.transform = `scaleX(${Math.max(0.02, q)})`;
          setStage(a);
        };

        const jst = { p: 0 };
        render(0);
        gsap.to(jst, {
          p: 1,
          ease: "none",
          onUpdate: () => render(jst.p),
          scrollTrigger: {
            trigger: jpin,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 2.8)}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onToggle: (self) => uiStore.set({ navForceHide: self.isActive }),
          },
        });
        const halo = gsap.to(jh, { attr: { r: 26 }, opacity: 0.08, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });

        return () => {
          typeTw?.kill();
          ptl?.kill();
          halo.kill();
          Object.values(seg).forEach((s) => {
            s.el.style.strokeDasharray = "";
            s.el.style.strokeDashoffset = "";
          });
          jnodes.forEach((n) => n.classList.remove("on", "now"));
          juncs.forEach((j) => j.classList.remove("on"));
          jasync.classList.remove("on");
          meter.style.transform = "";
          jchips.forEach((c) => {
            c.style.opacity = "";
            c.style.transform = "";
            c.innerHTML = "";
          });
          uiStore.set({ navForceHide: false });
          setJourneyPanel(el, 0);
        };
      });
    },
    { scope: rootRef },
  );
}
