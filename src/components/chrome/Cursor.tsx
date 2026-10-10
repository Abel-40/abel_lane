"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion";
import { uiStore } from "@/lib/ui-store";

type QuickTo = ReturnType<typeof gsap.quickTo>;

/**
 * Custom cursor ring (fine pointers only, no reduced motion) plus delegated magnetic buttons:
 * any [data-magnetic] element follows the pointer ×.3 / ×.35 and springs back (elastic.out(1, .45)).
 * Delegation means elements mounted later (new routes, the overlay) work without rebinding.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const cursor = ref.current!;
    const label = cursor.querySelector<HTMLElement>(".cursor-label")!;
    const html = document.documentElement;
    html.classList.add("has-cursor");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });

    const mags = new WeakMap<Element, { x: QuickTo; y: QuickTo }>();
    let current: HTMLElement | null = null;
    const release = () => {
      if (!current) return;
      const q = mags.get(current);
      q?.x(0);
      q?.y(0);
      current = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cx(e.clientX);
      cy(e.clientY);
      cursor.classList.remove("is-off");
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (current && current !== el) release();
      if (!el) return;
      let q = mags.get(el);
      if (!q) {
        q = {
          x: gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .45)" }),
          y: gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .45)" }),
        };
        mags.set(el, q);
      }
      const r = el.getBoundingClientRect();
      q.x((e.clientX - r.left - r.width / 2) * 0.3);
      q.y((e.clientY - r.top - r.height / 2) * 0.35);
      current = el;
    };
    const onLeaveWindow = () => {
      cursor.classList.add("is-off");
      release();
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      const lab = t.closest<HTMLElement>("[data-cursor]");
      const link = t.closest("a, button, input, select, textarea, label");
      if (lab && !uiStore.get().overlayOpen) {
        label.textContent = lab.getAttribute("data-cursor");
        cursor.classList.add("has-label");
        cursor.classList.remove("is-link");
      } else {
        cursor.classList.remove("has-label");
        cursor.classList.toggle("is-link", !!link);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") cursor.classList.add("is-off");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerover", onOver);
    html.addEventListener("mouseleave", onLeaveWindow);
    const unsub = uiStore.subscribe(() => {
      if (uiStore.get().overlayOpen) cursor.classList.remove("has-label", "is-link");
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", onOver);
      html.removeEventListener("mouseleave", onLeaveWindow);
      unsub();
      html.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div className="cursor is-off" ref={ref} aria-hidden="true">
      <span className="cursor-label" />
    </div>
  );
}
