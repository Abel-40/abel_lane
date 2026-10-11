"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { holdIntro, releaseIntro } from "@/lib/intro";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollToY } from "@/lib/scroll";
import { setLastPage } from "@/lib/nav-history";
import { uiStore } from "@/lib/ui-store";

interface TransitionApi {
  /** Navigate with the route shutter (reference go()). */
  navigate: (href: string, opts?: { replace?: boolean }) => void;
}

const TransitionContext = createContext<TransitionApi>({ navigate: () => {} });

export const useTransitionRouter = () => useContext(TransitionContext);

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
const isProjectDetail = (p: string) => /^\/projects\/[^/]+$/.test(p);

/** Focus the new page's h1 (or the main region) after every navigation. */
export function focusMain() {
  const main = document.getElementById("main");
  const h = main?.querySelector<HTMLElement>("h1");
  const target = h ?? main;
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  try {
    target.focus({ preventScroll: true });
  } catch {
    /* ignore */
  }
}

/**
 * Owns the route shutter. Sequence (reference go()): bars sweep up → `GET /path` → `200 OK` →
 * router.push → wait for the new route to commit → reset scroll, refresh ScrollTrigger, focus h1 →
 * bars exit upward; page intros start .42s after the swap. Back/forward plays a single fast sweep.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const shutterRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const queued = useRef<string | null>(null);
  const lastPath = useRef(normalize(pathname));
  const waiters = useRef<{ path: string; resolve: () => void }[]>([]);
  const navigateRef = useRef<TransitionApi["navigate"]>(() => {});

  // Resolve pending swaps once the new route has committed (children's effects have run by now).
  useEffect(() => {
    const p = normalize(pathname);
    lastPath.current = p;
    setLastPage(p);
    const ready = waiters.current.filter((w) => w.path === p);
    if (!ready.length) return;
    waiters.current = waiters.current.filter((w) => w.path !== p);
    requestAnimationFrame(() => ready.forEach((w) => w.resolve()));
  }, [pathname]);

  const waitForPath = useCallback((path: string) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(done, 6000);
      function done() {
        clearTimeout(timer);
        resolve();
      }
      waiters.current.push({ path, resolve: done });
    });
  }, []);

  const afterSwap = useCallback(() => {
    scrollToY(0, false);
    ScrollTrigger.refresh();
    focusMain();
  }, []);

  const parts = () => {
    const sh = shutterRef.current!;
    return {
      sh,
      bars: sh.querySelectorAll<HTMLElement>(".sh-bar"),
      label: sh.querySelector<HTMLElement>(".sh-line")!,
      ok: sh.querySelector<HTMLElement>(".sh-ok")!,
      path: sh.querySelector<HTMLElement>(".sh-path")!,
    };
  };

  const navigate = useCallback<TransitionApi["navigate"]>(
    (href, opts = {}) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      const path = normalize(url.pathname);
      uiStore.set({ menuOpen: false, menuInstant: true });
      if (busy.current) {
        queued.current = href; // polish D3: keep the latest request instead of dropping it
        return;
      }
      if (path === normalize(window.location.pathname)) {
        scrollToY(0, true);
        return;
      }
      const go = () => (opts.replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false }));
      if (prefersReducedMotion() || !shutterRef.current) {
        go();
        waitForPath(path).then(afterSwap);
        return;
      }
      busy.current = true;
      const { sh, bars, label, ok, path: pathEl } = parts();
      pathEl.textContent = path;
      gsap
        .timeline({ onComplete: swap })
        .set(sh, { visibility: "visible" })
        .set(ok, { autoAlpha: 0 })
        .fromTo(bars, { yPercent: 100 }, { yPercent: 0, duration: 0.62, ease: "power4.inOut", stagger: 0.055 })
        .fromTo(label, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, "-=.22")
        .to(ok, { autoAlpha: 1, duration: 0.12 }, "+=.12");

      async function swap() {
        holdIntro();
        go();
        await waitForPath(path);
        afterSwap();
        gsap.delayedCall(0.42, releaseIntro);
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(sh, { visibility: "hidden" });
              busy.current = false;
              const next = queued.current;
              queued.current = null;
              if (next) navigateRef.current(next);
            },
          })
          .to(label, { autoAlpha: 0, y: -18, duration: 0.24, ease: "power2.in" }, "+=.14")
          .to(bars, { yPercent: -100, duration: 0.68, ease: "power4.inOut", stagger: 0.055 }, "<");
      }
    },
    [router, waitForPath, afterSwap],
  );

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Back / forward: the browser has already changed the URL, so cover instantly and play one fast sweep out.
  useEffect(() => {
    const onPop = () => {
      const to = normalize(window.location.pathname);
      const from = lastPath.current;
      if (to === from) return;
      uiStore.set({ menuOpen: false, menuInstant: true });
      // Project overlay open/close is its own animation (intercepted route).
      if (isProjectDetail(to) || isProjectDetail(from)) return;
      if (prefersReducedMotion() || !shutterRef.current) {
        waitForPath(to).then(afterSwap);
        return;
      }
      const { sh, bars, label } = parts();
      busy.current = true;
      gsap.killTweensOf([...bars, label]);
      gsap.set(sh, { visibility: "visible" });
      gsap.set(bars, { yPercent: 0 });
      gsap.set(label, { autoAlpha: 0 });
      holdIntro();
      waitForPath(to).then(() => {
        afterSwap();
        gsap.delayedCall(0.12, releaseIntro);
        gsap.to(bars, {
          yPercent: -100,
          duration: 0.42,
          ease: "power4.inOut",
          stagger: 0.03,
          onComplete: () => {
            gsap.set(sh, { visibility: "hidden" });
            busy.current = false;
          },
        });
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [waitForPath, afterSwap]);

  const api = useMemo(() => ({ navigate }), [navigate]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div className="shutter" ref={shutterRef} aria-hidden="true">
        <span className="sh-bar" />
        <span className="sh-bar" />
        <span className="sh-bar" />
        <span className="sh-bar" />
        <div className="sh-label">
          <span className="sh-line">
            <span className="sh-verb">GET</span>
            <span className="sh-path">/</span>
            <span className="sh-ok">200 OK</span>
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
