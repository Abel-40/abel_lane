"use client";

import type { RefObject } from "react";
import { useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/idle";

/**
 * useGSAP for below-the-fold sections: the setup runs when the section nears the viewport (page order
 * preserved), inside the same GSAP context, so unmount still reverts everything it created.
 */
export function useIdleGSAP(setup: () => void | (() => void), opts: { scope: RefObject<Element | null> }) {
  useGSAP((context) => {
    const el = opts.scope.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const cancel = whenNear(el, () => {
      context.add(() => {
        cleanup = setup();
      });
    });
    return () => {
      cancel();
      if (typeof cleanup === "function") cleanup();
    };
  }, opts);
}
