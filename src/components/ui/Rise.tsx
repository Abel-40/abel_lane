"use client";

import { useRef } from "react";
import { rise } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";

type Tag = "div" | "section" | "ul" | "ol";

/** Static section with the reference `rise` reveal on its items (or itself). Static under reduced motion. */
export function Rise({
  as = "div",
  items,
  extra,
  children,
  ...rest
}: {
  as?: Tag;
  /** Selector for the items to reveal; the element itself when omitted. */
  items?: string;
  extra?: gsap.TweenVars;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        rise(items ? el.querySelectorAll(items) : [el], el, extra);
      });
    },
    { scope: ref },
  );
  const T = as as React.ElementType;
  return (
    <T ref={ref} {...rest}>
      {children}
    </T>
  );
}
