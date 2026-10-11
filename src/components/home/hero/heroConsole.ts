"use client";

import { consoleScenarios } from "@/content/hero-console";
import type { ConsoleScenario } from "@/content/types";
import { gsap } from "@/lib/gsap";

/* The glass "sample request" console (reference heroConsole). The numbers are illustrative and the
   card stays labelled "sample request" (PROMPT §6). Create inside a useGSAP callback. */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** JSON syntax colours: keys accent, strings ok, numbers/booleans warn. */
function hl(line: string) {
  let out = "";
  let last = 0;
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    if (m[1]) out += `<span class="${m[2] ? "jk" : "js"}">${esc(m[1])}</span>${m[2] ?? ""}`;
    else if (m[3]) out += `<span class="jb">${m[3]}</span>`;
    else out += `<span class="jn">${m[4]}</span>`;
    last = re.lastIndex;
  }
  return out + esc(line.slice(last));
}

export interface HeroConsole {
  start(): void;
  still(): void;
  bump(): void;
  setVisible(v: boolean): void;
  kill(): void;
}

export function createHeroConsole(root: HTMLElement): HeroConsole {
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T & Element>(s)!;
  const con = $(".hv-console");
  const proj = $(".hvc-proj");
  const path = $(".hvc-path");
  const st = $(".hvc-st");
  const stB = st.querySelector("b")!;
  const stE = st.querySelector("em")!;
  const pin = $(".hvc-in");
  const pout = $(".hvc-out");
  const trace = $(".hvc-trace");
  const sps = Array.from(con.querySelectorAll<HTMLElement>(".hvc-sp"));
  const mv = $(".hvm-v span");
  const sLine = $<SVGPathElement>(".hvm-line");
  const sArea = $<SVGPathElement>(".hvm-area");
  const qn = root.querySelector<HTMLElement>(".hvq-n");
  const S = consoleScenarios;

  const pts = [176, 181, 172, 190, 184, 179, 168, 175, 186, 181, 170, 177, 183, 174, 180, 184];
  const drawSpark = () => {
    const lo = Math.min(...pts) - 6;
    const hi = Math.max(...pts) + 6;
    const n = pts.length;
    const d = pts
      .map((v, k) => `${k ? "L" : "M"}${((k * 120) / (n - 1)).toFixed(1)} ${(32 - ((v - lo) / (hi - lo)) * 28).toFixed(1)}`)
      .join(" ");
    sLine.setAttribute("d", d);
    sArea.setAttribute("d", `${d} L120 34 L0 34 Z`);
  };

  let done = 1284;
  const total = (s: ConsoleScenario) => s.ms[0] + s.ms[1] + s.ms[2];

  const setScene = (s: ConsoleScenario, full: boolean) => {
    proj.textContent = s.p;
    path.textContent = s.path;
    const t = total(s);
    let acc = 0;
    sps.forEach((sp, k) => {
      (sp.firstChild as HTMLElement).textContent = s.sp[k];
      const b = sp.querySelector("b")!;
      b.style.left = `${((acc / t) * 100).toFixed(1)}%`;
      b.style.width = `${Math.max(4, (s.ms[k] / t) * 100).toFixed(1)}%`;
      acc += s.ms[k];
      sp.querySelector("em")!.textContent = full ? `${s.ms[k]} ms` : "—";
      gsap.set(b, { scaleX: full ? 1 : 0 });
    });
    pin.textContent = full ? s.req : "";
    pout.innerHTML = full ? s.res.map(hl).join("\n") : "";
    st.classList.toggle("ok", full);
    stB.textContent = full ? "200 OK" : "···";
    stE.textContent = full ? `· ${t} ms` : "pending";
  };

  let i = 0;
  let tl: gsap.core.Timeline | null = null;
  let dc: gsap.core.Tween | null = null;
  let alive = true;
  let visible = true;

  const run = () => {
    if (!alive) return;
    if (document.hidden || !visible) {
      dc = gsap.delayedCall(1.5, run);
      return;
    }
    const s = S[i % S.length];
    i++;
    const t = total(s);
    const o = { n: 0 };
    tl = gsap.timeline({ onComplete: () => void (alive && (dc = gsap.delayedCall(2.8, run))) });
    tl.to([pin, pout, trace], { autoAlpha: 0, duration: 0.25, ease: "power2.in" })
      .add(() => setScene(s, false))
      .set([pin, pout, trace], { autoAlpha: 1 })
      .fromTo([proj, path], { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out", stagger: 0.05 })
      .to(o, {
        n: s.req.length,
        duration: Math.min(1.1, s.req.length * 0.026),
        ease: "none",
        onUpdate: () => {
          const k = Math.round(o.n);
          pin.textContent = s.req.slice(0, k) + (k < s.req.length ? "▍" : "");
        },
      });
    sps.forEach((sp, k) => {
      const b = sp.querySelector("b")!;
      const em = sp.querySelector("em")!;
      tl!.to(b, {
        scaleX: 1,
        duration: 0.25 + (s.ms[k] / t) * 0.9,
        ease: "power2.out",
        onStart: () => {
          em.textContent = `${s.ms[k]} ms`;
        },
      });
    });
    s.res.forEach((line, k) => {
      tl!.add(() => pout.insertAdjacentHTML("beforeend", (k ? "\n" : "") + hl(line)), "+=.08");
    });
    tl.add(() => {
      st.classList.add("ok");
      stB.textContent = "200 OK";
      stE.textContent = `· ${t} ms`;
      pts.shift();
      pts.push(s.p95);
      drawSpark();
      const mo = { v: Number(mv.textContent) || s.p95 };
      gsap.to(mo, { v: s.p95, duration: 0.8, ease: "power2.out", onUpdate: () => void (mv.textContent = String(Math.round(mo.v))) });
    })
      .fromTo(st, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, "<")
      .fromTo(sLine, { opacity: 0.3 }, { opacity: 1, duration: 0.6 }, "<");
  };

  drawSpark();

  return {
    start: () => run(),
    still: () => setScene(S[0], true),
    bump: () => {
      done += 1 + ((Math.random() * 3) | 0);
      if (qn) qn.textContent = done.toLocaleString("en-US");
    },
    setVisible: (v) => {
      visible = v;
      if (tl) {
        if (v) tl.resume();
        else tl.pause();
      }
    },
    kill: () => {
      alive = false;
      tl?.kill();
      dc?.kill();
    },
  };
}
