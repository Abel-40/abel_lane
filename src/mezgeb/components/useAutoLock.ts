"use client";

import { useEffect } from "react";
import { lockExpired, lockNow, markActive } from "../lib/session";

/**
 * Signs out after N minutes without a tap or key press, and when the app
 * comes back from the background after longer than that.
 */
export function useAutoLock(enabled: boolean, minutes: number) {
  useEffect(() => {
    if (!enabled) return;
    let lastWrite = 0;
    const touch = () => {
      const now = Date.now();
      if (now - lastWrite > 5_000) {
        lastWrite = now;
        markActive(now);
      }
    };
    const check = () => {
      if (lockExpired()) void lockNow("locked");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") markActive();
      else check();
    };

    markActive();
    const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", check);
    const timer = window.setInterval(check, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", check);
      window.clearInterval(timer);
    };
  }, [enabled, minutes]);
}
