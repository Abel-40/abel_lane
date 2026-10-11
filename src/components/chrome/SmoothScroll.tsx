"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/scroll";

/** Lenis on the window, driven by gsap.ticker; ScrollTrigger updates on every Lenis scroll. Off under reduced motion. */
export function SmoothScroll() {
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<LenisRef>(null);

  useEffect(() => {
    history.scrollRestoration = "manual";
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf: ((time: number) => void) | null = null;
    let detach: (() => void) | null = null;
    // ReactLenis creates the instance in its own effect, which can land a few frames later on a busy first load
    // (loader + hydration). Keep checking every frame: giving up leaves a Lenis that swallows wheel events while
    // nothing drives it (autoRaf is off), so the wheel stops scrolling.
    let id = 0;
    const attach = () => {
      const lenis = ref.current?.lenis;
      if (!lenis) {
        id = requestAnimationFrame(attach);
        return;
      }
      setLenis(lenis);
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      detach = () => lenis.off("scroll", onScroll);
    };
    id = requestAnimationFrame(attach);
    return () => {
      cancelAnimationFrame(id);
      if (raf) gsap.ticker.remove(raf);
      detach?.();
      setLenis(null);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <ReactLenis root ref={ref} options={{ lerp: 0.1, smoothWheel: true, autoRaf: false }} />;
}
