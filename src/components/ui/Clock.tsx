"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

/* Live Addis Ababa time (HH:MM, 24h). Server and first client render show "--:--" (no hydration mismatch). */

const fmt = () => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: site.timeZone,
    }).format(new Date());
  } catch {
    return "--:--";
  }
};

let current = "--:--";
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = fmt();
    timer = setInterval(() => {
      const next = fmt();
      if (next !== current) {
        current = next;
        listeners.forEach((l) => l());
      }
    }, 15000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useClock() {
  return useSyncExternalStore(subscribe, () => current, () => "--:--");
}

export function Clock({ as: Tag = "b" }: { as?: "b" | "span" }) {
  const t = useClock();
  return (
    <Tag className="clock" suppressHydrationWarning>
      {t}
    </Tag>
  );
}
