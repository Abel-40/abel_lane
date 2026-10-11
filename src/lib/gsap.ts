"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  // No automatic refresh on window load: refreshes are batched through requestRefresh() (lib/idle.ts),
  // because each full refresh re-measures both pinned sections.
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
