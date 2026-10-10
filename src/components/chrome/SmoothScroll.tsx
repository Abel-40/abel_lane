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
    // ReactLenis creates the instance in its own effect; pick it up on the next frame.
    const id = requestAnimationFrame(() => {
      const lenis = ref.current?.lenis;
      if (!lenis) return;
      setLenis(lenis);
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      detach = () => lenis.off("scroll", onScroll);
    });
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
