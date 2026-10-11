"use client";

import { useEffect } from "react";
import { requestRefresh } from "@/lib/idle";

/** Re-measure every ScrollTrigger once web fonts have settled (pins depend on final text metrics). */
export function ScrollRefresh() {
  useEffect(() => {
    // Batched with the idle queue: one refresh once fonts and images have settled.
    let alive = true;
    document.fonts?.ready.then(() => alive && requestRefresh());
    window.addEventListener("load", requestRefresh, { once: true });
    return () => {
      alive = false;
      window.removeEventListener("load", requestRefresh);
    };
  }, []);
  return null;
}
