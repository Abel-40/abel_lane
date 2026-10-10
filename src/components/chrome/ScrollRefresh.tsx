"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/** Re-measure every ScrollTrigger once web fonts and images have settled (pins depend on final layout). */
export function ScrollRefresh() {
  useEffect(() => {
    let alive = true;
    const refresh = () => alive && ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    if (document.readyState === "complete") requestAnimationFrame(refresh);
    else window.addEventListener("load", refresh, { once: true });
    return () => {
      alive = false;
      window.removeEventListener("load", refresh);
    };
  }, []);
  return null;
}
