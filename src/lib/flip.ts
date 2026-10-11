"use client";

/* Flip is only needed by the tools board and the project filters; keeping it out of lib/gsap keeps it off
   the other routes' bundles. */
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

export { Flip };
