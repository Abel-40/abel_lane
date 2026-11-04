"use client";

import { useEffect } from "react";

/** Registers Mezgeb's service worker. Rendered only by the Mezgeb root layout. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/mezgeb-sw.js", { scope: "/mezgeb" }).catch(() => {
      /* the app works without it, just not offline */
    });
  }, []);
  return null;
}
