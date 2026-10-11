"use client";

import Image from "next/image";
import { useRef } from "react";
import abel from "@/assets/abel.webp";
import { pageIntro } from "@/lib/anim";
import { gsap, useGSAP } from "@/lib/gsap";
import { whenIntro } from "@/lib/intro";
import { isFinePointer } from "@/lib/motion";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { MarkupIcon } from "@/components/ui/Icon";

/**
 * About hero. The photo (the only place it appears) reveals with a clip-path wipe while the image scales
 * 1.25 → 1; the name tag slides in, the chip pops; pointer 3D tilt and a slight scroll parallax.
 */
export function AboutHero({ hasResume }: { hasResume: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const frame = el.querySelector<HTMLElement>(".ph-frame")!;
        const img = frame.querySelector("img")!;
        const master = gsap.timeline({ paused: true });
        master.add(pageIntro(el), 0).add(
          gsap
            .timeline()
            .fromTo(frame, { clipPath: "inset(100% 0% 0% 0% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.3, ease: "expo.inOut" })
            .from(img, { scale: 1.25, yPercent: 12, duration: 1.5, ease: "expo.out" }, "<.35")
            .from(el.querySelector(".ph-tag"), { x: -40, autoAlpha: 0, duration: 0.8, ease: "power3.out" }, "-=.9")
            .from(el.querySelector(".ph-chip"), { scale: 0.5, autoAlpha: 0, duration: 0.8, ease: "back.out(2.2)" }, "-=.6"),
          0.15,
        );
        const cancel = whenIntro((covered) => (covered ? master.play() : master.progress(1)));
        gsap.to(img, {
          yPercent: -5,
          ease: "none",
          scrollTrigger: { trigger: el.querySelector(".ab-photo"), start: "top 60%", end: "bottom top", scrub: true },
        });

        if (!isFinePointer()) return cancel;
        const fig = el.querySelector<HTMLElement>(".ab-photo")!;
        gsap.set(frame, { transformPerspective: 900 });
        const rx = gsap.quickTo(frame, "rotationX", { duration: 0.7, ease: "power3" });
        const ry = gsap.quickTo(frame, "rotationY", { duration: 0.7, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const r = fig.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 12);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        fig.addEventListener("pointermove", onMove);
        fig.addEventListener("pointerleave", onLeave);
        return () => {
          cancel();
          fig.removeEventListener("pointermove", onMove);
          fig.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: root },
  );

  return (
    <section className="wrap ab-hero" ref={root}>
      <div>
        <p className="kicker">About</p>
        <h1 className="h1" data-split="" tabIndex={-1}>
          From UI/UX to the systems behind products.
        </h1>
        <p className="lead hero-fade">
          I started in UI/UX and full-stack work, then moved deeper into backend engineering because I enjoy building
          the systems behind products.
        </p>
        <p className="lead hero-fade">
          Today I focus on backend services and AI-integrated systems: APIs, asynchronous workers, data pipelines,
          semantic search, RAG and production LLM integrations.
        </p>
        <div className="btn-row hero-fade">
          {hasResume && (
            <a className="btn btn-accent" href="/resume.pdf" download data-magnetic="">
              Résumé <MarkupIcon name="download" />
            </a>
          )}
          <TransitionLink href="/contact" className={hasResume ? "btn btn-ghost" : "btn btn-accent"} data-magnetic="">
            Get in touch
          </TransitionLink>
        </div>
      </div>
      <figure className="ab-photo" id="abPhoto">
        <div className="ph-frame" id="phFrame">
          <div className="ph-grid" aria-hidden="true" />
          <Image
            src={abel}
            alt="Abel Addis in a beige blazer, arms crossed"
            sizes="(max-width: 899px) 320px, 386px"
            loading="eager"
            fetchPriority="high"
            placeholder="empty"
          />
        </div>
        <figcaption className="ph-tag">
          <b>Abel Addis</b>
          <span>Backend Engineer, AI Systems</span>
        </figcaption>
        <span className="ph-chip">
          <span className="pulse-dot" />
          Freelancing, open to remote
        </span>
      </figure>
    </section>
  );
}
