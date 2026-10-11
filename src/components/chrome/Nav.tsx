"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { navRoutes, routeKeyFor, site } from "@/content/site";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { whenIntro } from "@/lib/intro";
import { prefersReducedMotion } from "@/lib/motion";
import { lockScroll } from "@/lib/scroll";
import { uiStore, useUI } from "@/lib/ui-store";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { MarkupIcon } from "@/components/ui/Icon";
import { Availability } from "@/components/ui/Availability";
import { ThemeToggle } from "./ThemeToggle";

const HINTS: Record<string, string> = {
  home: "/",
  about: "/about",
  projects: "/projects",
  cases: "/case-studies",
  contact: "/contact",
};

/** "AB" monogram in Great Vibes: strokes draw in after the loader, then fill (reference boot). */
function BrandMark() {
  const textRef = useRef<SVGTextElement>(null);
  useEffect(() => {
    const mt = textRef.current;
    if (!mt || prefersReducedMotion()) return;
    gsap.set(mt, { strokeDasharray: 240, strokeDashoffset: 240, fillOpacity: 0 });
    let cancel = () => {};
    let tl: gsap.core.Timeline | null = null;
    const go = () => {
      cancel = whenIntro(() => {
        tl = gsap
          .timeline({ delay: 0.25 })
          .to(mt, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" })
          .to(mt, { fillOpacity: 1, duration: 0.6, ease: "power2.out" }, "-=.5")
          .set(mt, { clearProps: "strokeDasharray,strokeDashoffset" });
      });
    };
    const family = getComputedStyle(mt).fontFamily;
    if (document.fonts?.load) document.fonts.load(`24px ${family}`).then(go, go);
    else go();
    return () => {
      cancel();
      tl?.kill();
      gsap.set(mt, { clearProps: "all" });
    };
  }, []);
  return (
    <span className="mark" aria-hidden="true">
      <svg viewBox="0 0 44 44" focusable="false">
        <text ref={textRef} className="mark-t" x="22" y="30.5" textAnchor="middle">
          AB
        </text>
      </svg>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const active = routeKeyFor(pathname);
  const menuOpen = useUI((s) => s.menuOpen);
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  /* sliding white pill under the active / hovered link */
  const placePill = useCallback((target: HTMLElement | null) => {
    const pill = pillRef.current;
    if (!pill) return;
    if (!target || !target.offsetParent) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${target.offsetWidth}px`;
    pill.style.transform = `translateX(${target.offsetLeft}px)`;
  }, []);
  const activeLink = useCallback(() => linksRef.current?.querySelector<HTMLElement>(".link.on") ?? null, []);

  useLayoutEffect(() => {
    placePill(activeLink());
  }, [active, placePill, activeLink]);

  useEffect(() => {
    const onResize = () => placePill(activeLink());
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [placePill, activeLink]);

  /* progress bar + hide on scroll-down past 260px, show on scroll-up, force-hide while the journey pins */
  useEffect(() => {
    const nav = navRef.current!;
    const bar = progressRef.current!;
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      refreshPriority: -1,
      onUpdate: (s) => {
        bar.style.transform = `scaleX(${s.progress})`;
        const ui = uiStore.get();
        if (!ui.menuOpen) nav.classList.toggle("is-hidden", ui.navForceHide || (s.direction === 1 && s.scroll() > 260));
      },
    });
    const unsub = uiStore.subscribe(() => {
      const ui = uiStore.get();
      if (ui.menuOpen) nav.classList.remove("is-hidden");
      else if (ui.navForceHide) nav.classList.add("is-hidden");
    });
    return () => {
      st.kill();
      unsub();
    };
  }, []);

  /* full-screen menu: circle clip from the top-right (open .75s, close .55s), instant on route change */
  useEffect(() => {
    const menu = menuRef.current!;
    const nav = navRef.current!;
    const btn = menuBtnRef.current!;
    const outside = [document.getElementById("main"), document.querySelector("footer.foot")];
    const motion = !prefersReducedMotion();
    if (menuOpen && !wasOpen.current) {
      wasOpen.current = true;
      menu.hidden = false;
      lockScroll(true);
      nav.classList.add("menu-open");
      nav.classList.remove("is-hidden");
      outside.forEach((el) => el?.setAttribute("inert", ""));
      if (motion) {
        gsap
          .timeline()
          .fromTo(menu, { clipPath: "circle(0% at 100% 0%)" }, { clipPath: "circle(150% at 100% 0%)", duration: 0.75, ease: "power3.inOut" })
          .fromTo(menu.querySelectorAll(".menu-link"), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" }, "-=.38")
          .fromTo(menu.querySelector(".menu-foot"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=.4");
      }
      menu.querySelector<HTMLElement>(".menu-link")?.focus({ preventScroll: true });
    } else if (!menuOpen && wasOpen.current) {
      wasOpen.current = false;
      lockScroll(false);
      nav.classList.remove("menu-open");
      outside.forEach((el) => el?.removeAttribute("inert"));
      const instant = uiStore.get().menuInstant;
      if (motion && !instant) {
        gsap.to(menu, {
          clipPath: "circle(0% at 100% 0%)",
          duration: 0.55,
          ease: "power3.inOut",
          onComplete: () => {
            menu.hidden = true;
            gsap.set(menu, { clearProps: "clipPath" });
          },
        });
        btn.focus({ preventScroll: true });
      } else {
        gsap.killTweensOf(menu);
        menu.hidden = true;
        gsap.set(menu, { clearProps: "clipPath" });
      }
    }
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && uiStore.get().menuOpen) uiStore.set({ menuOpen: false, menuInstant: false });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="progress" ref={progressRef} aria-hidden="true" />
      <header className="nav" id="nav" ref={navRef}>
        <div className="nav-in">
          <TransitionLink href="/" className="brand">
            <BrandMark />
            <span className="sr-only">Abel Addis, home</span>
            <span className="brand-name" aria-hidden="true">
              Abel <i>Addis</i>
            </span>
          </TransitionLink>
          <nav className="links" id="links" aria-label="Primary" ref={linksRef} onMouseLeave={() => placePill(activeLink())}>
            <span className="links-pill" ref={pillRef} aria-hidden="true" />
            {navRoutes.map((r) => (
              <TransitionLink
                key={r.key}
                href={r.href}
                className={`link${active === r.key ? " on" : ""}`}
                aria-current={active === r.key ? "page" : undefined}
                onMouseEnter={(e) => placePill(e.currentTarget)}
                onFocus={(e) => placePill(e.currentTarget)}
                onBlur={() => placePill(activeLink())}
              >
                {r.label}
              </TransitionLink>
            ))}
          </nav>
          <div className="nav-end">
            <Availability className="avail-nav" />
            <TransitionLink href="/contact" className="btn btn-accent btn-sm nav-cta" data-magnetic="">
              Let’s talk
            </TransitionLink>
            <button
              type="button"
              className="menu-btn"
              id="menuBtn"
              ref={menuBtnRef}
              aria-expanded={menuOpen}
              aria-controls="menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => uiStore.set({ menuOpen: !uiStore.get().menuOpen, menuInstant: false })}
            >
              <MarkupIcon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      <div className="menu" id="menu" ref={menuRef} hidden>
        <nav className="menu-links" aria-label="Menu">
          {navRoutes.map((r) => (
            <TransitionLink
              key={r.key}
              href={r.href}
              className={`menu-link${active === r.key ? " on" : ""}`}
              aria-current={active === r.key ? "page" : undefined}
            >
              {r.label} <small>{HINTS[r.key]}</small>
            </TransitionLink>
          ))}
        </nav>
        <div className="menu-foot">
          <Availability />
          <ThemeToggle variant="menu" />
          <span>{site.email}</span>
        </div>
      </div>
    </>
  );
}
