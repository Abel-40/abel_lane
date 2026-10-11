"use client";

import { ScrollTrigger } from "./gsap";

/* Below-the-fold animation setup is lazy: a section sets itself up when it comes within about one viewport
   of the screen (IntersectionObserver), in its own task, so loading the page isn't one long main-thread
   block. Setups always run in page order (a pinned section must exist before the triggers below it are
   measured), and one debounced ScrollTrigger.refresh follows each burst. Programmatic scrolls call
   flushLazy() first so pin spacers exist before a scroll target is measured. */

interface Task {
  el: Element;
  run: () => void;
  done: boolean;
  cancelled: boolean;
}

const tasks: Task[] = []; // in registration (= page) order
let io: IntersectionObserver | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let pumpScheduled = false;
const due = new Set<Task>();

/** Debounced ScrollTrigger.refresh: bursts of requests (setups, fonts ready) cost one refresh. */
export function requestRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    ScrollTrigger.refresh();
  }, 120);
}

function runTask(t: Task) {
  if (t.done || t.cancelled) return;
  t.done = true;
  io?.unobserve(t.el);
  t.run();
}

/** Set up the pending sections up to the last due one, in page order, one per frame. */
function pump() {
  pumpScheduled = false;
  let last = -1;
  tasks.forEach((t, i) => {
    if (due.has(t)) last = i;
  });
  if (last < 0) return;
  const next = tasks.find((t, i) => i <= last && !t.done && !t.cancelled);
  if (next) {
    runTask(next);
    requestRefresh();
  }
  for (const t of [...due]) if (t.done || t.cancelled) due.delete(t);
  if (due.size) schedulePump();
}

function schedulePump() {
  if (pumpScheduled) return;
  pumpScheduled = true;
  requestAnimationFrame(() => setTimeout(pump, 0));
}

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const t = tasks.find((x) => x.el === e.target && !x.done);
        if (t) due.add(t);
      }
      if (due.size) schedulePump();
    },
    { rootMargin: "0px 0px 100% 0px" },
  );
  return io;
}

/* Shortly after load, set up whatever is still pending in the background (one section per idle chunk), so
   a jump far down the page (scrollbar drag, End key) never lands before a pin exists. */
let backgroundScheduled = false;
function scheduleBackground() {
  if (backgroundScheduled || typeof window === "undefined") return;
  backgroundScheduled = true;
  const start = () =>
    setTimeout(function step() {
      const next = tasks.find((t) => !t.done && !t.cancelled);
      if (!next) {
        backgroundScheduled = false; // re-arm for the next page
        return;
      }
      due.add(next);
      schedulePump();
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (idle) idle(() => setTimeout(step, 0));
      else setTimeout(step, 50);
    }, 3000);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

/** Set up `run` when `el` nears the viewport. Returns a cancel function (call it on unmount). */
export function whenNear(el: Element, run: () => void): () => void {
  const task: Task = { el, run, done: false, cancelled: false };
  tasks.push(task);
  observer().observe(el);
  scheduleBackground();
  return () => {
    task.cancelled = true;
    io?.unobserve(el);
    due.delete(task);
    const i = tasks.indexOf(task);
    if (i >= 0) tasks.splice(i, 1);
  };
}

/** Set up every pending section now (before programmatic scrolls, so their pins and spacers exist). */
export function flushLazy() {
  let ran = false;
  for (const t of [...tasks]) {
    if (!t.done && !t.cancelled) {
      runTask(t);
      ran = true;
    }
  }
  due.clear();
  if (ran) ScrollTrigger.refresh();
}

/** Run `run` once the browser is idle (used by intros, which must not delay first paint). */
export function whenIdle(run: () => void): () => void {
  let cancelled = false;
  const go = () => !cancelled && run();
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const id = window.requestIdleCallback(go, { timeout: 300 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(id);
    };
  }
  const id = setTimeout(go, 16);
  return () => {
    cancelled = true;
    clearTimeout(id);
  };
}
