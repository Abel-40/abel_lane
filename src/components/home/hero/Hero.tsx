"use client";

import { useRef } from "react";
import { heroStackChips, rotatingWords } from "@/content/hero-console";
import { site } from "@/content/site";
import { splitChars } from "@/lib/anim";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
import { isFinePointer, MQ } from "@/lib/motion";
import { scrollToY } from "@/lib/scroll";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Clock } from "@/components/ui/Clock";
import { Icon } from "@/components/ui/Icon";
import { createHeroConsole } from "./heroConsole";

const CREDS = [
  ["Andela", "Backend Engineer, 2025–26"],
  ["AWS Certified", "Cloud Practitioner"],
  ["BSc Software Engineering", "Arba Minch University, 2026"],
  ["2+ years", "software and product work"],
] as const;

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useIntroGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const hcon = createHeroConsole(el);
      const mm = gsap.matchMedia();
      let startIntro: ((covered: boolean) => void) | null = null;

      mm.add(MQ.reduce, () => {
        hcon.still(); // one finished scenario, no loops (PROMPT 5.8)
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const chars = q(".hero-title [data-split]").flatMap((line) => splitChars(line, false).chars);
        const rot = el.querySelector<HTMLElement>(".rot")!;
        const loops: gsap.core.Animation[] = [];
        const timers: gsap.core.Tween[] = [];

        /* intro (reference INIT.home), played when the loader/shutter lifts */
        const intro = gsap
          .timeline({ paused: true })
          .from(q(".hero-orbs i"), { opacity: 0, scale: 0.55, duration: 1.8, ease: "power2.out", stagger: 0.12 }, 0)
          .from(q(".hero-kicker"), { y: 18, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.05)
          .from(chars, { yPercent: 120, duration: 1.1, ease: "power4.out", stagger: 0.02 }, 0.12)
          .from(q(".ht-rot"), { yPercent: 50, opacity: 0, duration: 0.9, ease: "power3.out" }, 0.4)
          // the lead (the LCP text) rises without fading so it is painted from the first frame (PARITY D29)
          .from(q(".hero-lead"), { y: 26, duration: 0.8, ease: "power3.out" }, 0.7)
          .from(q(".hero-ctas > *"), { y: 26, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.78)
          .from(q(".creds li"), { y: 20, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 }, 0.9)
          .from(q(".hv-console"), { y: 80, scale: 0.93, opacity: 0, duration: 1.15, ease: "power3.out" }, 0.3)
          .from(q(".hv-metric"), { x: -60, y: -24, rotation: -7, opacity: 0, duration: 1, ease: "back.out(1.5)" }, 0.72)
          .from(q(".hv-queue"), { x: 60, y: 34, rotation: 7, opacity: 0, duration: 1, ease: "back.out(1.5)" }, 0.84)
          .from(q(".hv-now"), { y: -26, opacity: 0, duration: 0.8, ease: "power3.out" }, 0.95)
          .from(q(".hvs-i"), { scale: 0, opacity: 0, duration: 0.55, ease: "back.out(2.6)", stagger: 0.06 }, 1.05)
          .from(q(".scroll-cue"), { opacity: 0, duration: 0.6 }, 1.2);

        /* rotating word: old slides up and out, new slides up and in, width animates */
        let wi = 0;
        let alive = true;
        let rtl: gsap.core.Timeline | null = null;
        const nextWord = () => {
          if (!alive) return;
          if (document.hidden) {
            timers.push(gsap.delayedCall(2.4, nextWord));
            return;
          }
          wi = (wi + 1) % rotatingWords.length;
          const old = rot.querySelector<HTMLElement>(".rot-word")!;
          const nw = document.createElement("span");
          nw.className = "rot-word";
          nw.textContent = rotatingWords[wi];
          const w0 = rot.getBoundingClientRect().width;
          const cs = getComputedStyle(rot);
          nw.style.position = "absolute";
          nw.style.left = cs.paddingLeft;
          nw.style.top = cs.paddingTop;
          rot.appendChild(nw);
          const w1 = nw.getBoundingClientRect().width + parseFloat(cs.paddingLeft) * 2;
          rtl = gsap
            .timeline({
              onComplete: () => {
                old.remove();
                nw.removeAttribute("style");
                gsap.set(rot, { clearProps: "width" });
                timers.push(gsap.delayedCall(2.2, nextWord));
              },
            })
            .set(rot, { width: w0 })
            .to(old, { yPercent: -115, opacity: 0, duration: 0.5, ease: "power3.in" })
            .fromTo(nw, { yPercent: 115 }, { yPercent: 0, duration: 0.7, ease: "power3.out" }, 0.28)
            .to(rot, { width: w1, duration: 0.7, ease: "power3.inOut" }, 0.18);
        };

        const startLoops = (covered: boolean) => {
          const d = covered ? 1 : 0; // after an intro, loops begin as the cards settle
          timers.push(gsap.delayedCall(covered ? 1.2 : 0, hcon.start));
          loops.push(gsap.to(q(".hv-metric"), { y: -9, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.9 * d }));
          loops.push(gsap.to(q(".hv-queue"), { y: 10, duration: 3.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.1 * d }));
          q(".hv-queue li b").forEach((b, k) => {
            loops.push(
              gsap.fromTo(
                b,
                { scaleX: 0 },
                { scaleX: 1, duration: 2.1 + k * 0.8, ease: "power1.inOut", repeat: -1, repeatDelay: 0.5, delay: 1.4 * d + k * 0.35, onRepeat: hcon.bump },
              ),
            );
          });
          timers.push(gsap.delayedCall(covered ? 2.8 : 2.2, nextWord));
        };

        startIntro = (covered) => {
          if (covered) intro.play();
          else intro.progress(1); // already painted: no flicker, keep the static final state
          startLoops(covered);
        };

        /* pause offscreen loops (improvement): console, bobbing cards, queue bars, orb drift */
        const vis = ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            hcon.setVisible(self.isActive);
            loops.forEach((t) => (self.isActive ? t.resume() : t.pause()));
            el.classList.toggle("is-offscreen", !self.isActive);
          },
        });

        return () => {
          alive = false;
          rtl?.kill();
          timers.forEach((t) => t.kill());
          vis.kill();
          // restore the first word so a re-init starts clean
          const words = rot.querySelectorAll(".rot-word");
          words.forEach((w, k) => (k < words.length - 1 ? w.remove() : (w.removeAttribute("style"), (w.textContent = rotatingWords[0]))));
          gsap.set(rot, { clearProps: "width" });
        };
      });

      /* scroll-out drift (desktop: cards drift apart) */
      mm.add(MQ.desktop, () => {
        const st = { trigger: el, start: "top top", end: "bottom top", scrub: true } as const;
        gsap.to(q(".hero-in"), { yPercent: -14, opacity: 0.15, ease: "none", scrollTrigger: st });
        gsap.to(q(".hero-vis"), { yPercent: -12, ease: "none", scrollTrigger: st });
        gsap.to(q(".hv-metric"), { yPercent: -60, xPercent: -10, ease: "none", scrollTrigger: st });
        gsap.to(q(".hv-queue"), { yPercent: 40, xPercent: 8, ease: "none", scrollTrigger: st });
        gsap.to(q(".hero-orbs"), { yPercent: 18, ease: "none", scrollTrigger: st });

        /* pointer parallax by depth + gentle 3D tilt of the stage */
        if (!isFinePointer()) return;
        const stage = el.querySelector<HTMLElement>(".hv-stage")!;
        const pp = { x: 0, y: 0 };
        const apply = () => {
          stage.style.setProperty("--px", pp.x.toFixed(3));
          stage.style.setProperty("--py", pp.y.toFixed(3));
        };
        const qpx = gsap.quickTo(pp, "x", { duration: 0.9, ease: "power3", onUpdate: apply });
        const qpy = gsap.quickTo(pp, "y", { duration: 0.9, ease: "power3", onUpdate: apply });
        gsap.set(stage, { transformPerspective: 1500 });
        const qry = gsap.quickTo(stage, "rotationY", { duration: 1.1, ease: "power3" });
        const qrx = gsap.quickTo(stage, "rotationX", { duration: 1.1, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          qpx(nx);
          qpy(ny);
          qry(nx * 5);
          qrx(-ny * 4);
        };
        const onLeave = () => {
          qpx(0);
          qpy(0);
          qry(0);
          qrx(0);
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          stage.style.removeProperty("--px");
          stage.style.removeProperty("--py");
        };
      });

      mm.add(MQ.mobile, () => {
        const st = { trigger: el, start: "top top", end: "bottom top", scrub: true } as const;
        gsap.to(q(".hero-in"), { yPercent: -14, opacity: 0.15, ease: "none", scrollTrigger: st });
        gsap.to(q(".hero-orbs"), { yPercent: 18, ease: "none", scrollTrigger: st });
      });

      return { start: (covered) => startIntro?.(covered), cleanup: () => hcon.kill() };
    },
    { scope: root },
  );

  return (
    <section className="hero" id="hero" ref={root}>
      <div className="hero-orbs" aria-hidden="true">
        <i className="o1" />
        <i className="o2" />
        <i className="o3" />
        <i className="o4" />
      </div>
      <div className="wrap hero-grid">
        <div className="hero-in">
          {/* the name line is part of the h1, so the page's main heading names who it is about */}
          <h1 className="hero-title" tabIndex={-1}>
            <span className="hero-kicker">
              <span className="pulse-dot" />
              <span>{site.name} · Backend engineer, AI systems · Ethiopia (UTC+3)</span>
            </span>
            <span className="sr-only">I build the systems behind AI products.</span>
            <span aria-hidden="true">
              <span className="ht-line" data-split="">
                I build the
              </span>
              <span className="ht-line ht-rot">
                <span className="rot" id="rot">
                  <span className="rot-word">{rotatingWords[0]}</span>
                </span>
                <span className="caret" />
              </span>
              <span className="ht-line" data-split="">
                behind AI products.
              </span>
            </span>
          </h1>
          <p className="lead hero-lead">
            Typed APIs, async workers, data pipelines and retrieval you can trust, shipped to production with
            FastAPI, Django and PostgreSQL.
          </p>
          <div className="hero-ctas">
            <a
              href="#work"
              className="btn btn-accent"
              data-magnetic=""
              onClick={(e) => {
                const work = document.getElementById("work");
                if (!work) return;
                e.preventDefault();
                scrollToY(work, true);
              }}
            >
              See the work <Icon name="arrow" className="ico-arrow" />
            </a>
            <TransitionLink href="/contact" className="btn btn-ghost" data-magnetic="">
              Get in touch
            </TransitionLink>
          </div>
        </div>
        <div className="hero-vis" aria-hidden="true">
          <div className="hv-stage">
            <div className="hv-card hv-console">
              <div className="hvc-bar">
                <span className="hvc-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="hvc-host">sample request</span>
                <span className="hvc-proj">MoodVerse</span>
              </div>
              <div className="hvc-body">
                <div className="hvc-req">
                  <span className="verb">POST</span>
                  <span className="hvc-path">/v1/reflect</span>
                  <span className="hvc-st">
                    <i />
                    <b>···</b>
                    <em>pending</em>
                  </span>
                </div>
                <pre className="hvc-in" />
                <div className="hvc-trace">
                  {["validate", "retrieve", "llm"].map((k) => (
                    <div className="hvc-sp" key={k}>
                      <span>{k}</span>
                      <i>
                        <b />
                      </i>
                      <em>—</em>
                    </div>
                  ))}
                </div>
                <pre className="hvc-out" />
              </div>
            </div>
            <div className="hv-card hv-metric">
              <span className="hvm-k">p95 latency</span>
              <b className="hvm-v">
                <span>184</span>
                <small>ms</small>
              </b>
              <svg className="hvm-spark" viewBox="0 0 120 34" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hvmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2F6EF0" stopOpacity=".28" />
                    <stop offset="1" stopColor="#2F6EF0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="hvm-area" />
                <path className="hvm-line" />
              </svg>
            </div>
            <div className="hv-card hv-queue">
              <div className="hvq-h">
                <span>Celery workers</span>
                <b>
                  <span className="hvq-n">1,284</span> done
                </b>
              </div>
              <ul>
                {["embed_chunks", "crawl_site", "price_checks"].map((j) => (
                  <li key={j}>
                    <span>{j}</span>
                    <i>
                      <b />
                    </i>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hv-card hv-now">
              <span className="pulse-dot" />
              <Clock />
              <span>Addis Ababa · open to remote</span>
            </div>
            <div className="hv-stack">
              {heroStackChips.map((k) => (
                <span className="hvs-i" key={k}>
                  <BrandLogo name={k} tint />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="wrap">
        <ul className="creds">
          {CREDS.map(([b, s]) => (
            <li key={b}>
              <b>{b}</b>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
