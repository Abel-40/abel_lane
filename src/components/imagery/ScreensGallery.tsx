"use client";

/* eslint-disable @next/next/no-img-element -- pre-optimised WebP (kit files + derived widths); we pass our own srcset */
import { useRef, useState } from "react";
import type { Project } from "@/content/types";
import { gsap } from "@/lib/gsap";
import { pad2, prefersReducedMotion } from "@/lib/motion";
import { Icon, MarkupIcon } from "@/components/ui/Icon";
import { imageSrcSet } from "@/content/image-variants";

/**
 * "Inside the product": a 16:10 viewer with all four screens stacked (only the active one visible), glass arrows,
 * caption row (counter, title, caption, Full size link) and thumbnails. Switching crossfades the incoming screen
 * (autoAlpha 0→1, scale 1.03→1, .7s power3.out) over the outgoing one; ←/→ move while focus is inside.
 * Mount with `key={project.id}` so opening another project resets it to the first screen.
 */
export function ScreensGallery({ p }: { p: Pick<Project, "name" | "shots"> }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = p.shots.length;
  const sh = p.shots[active];

  const go = (k: number) => {
    const next = (k + n) % n;
    if (next === active) return;
    const el = root.current;
    if (el && !prefersReducedMotion()) {
      const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(".gal-img"));
      const cur = imgs[active];
      const nx = imgs[next];
      nx.loading = "eager";
      gsap.killTweensOf(imgs);
      imgs.forEach((im) => im !== cur && im !== nx && gsap.set(im, { clearProps: "all" }));
      // React moves the "on" class; inline styles keep the outgoing screen under the incoming one until the fade ends
      gsap.set(nx, { zIndex: 1 });
      gsap.set(cur, { zIndex: 0, autoAlpha: 1 });
      gsap.fromTo(
        nx,
        { autoAlpha: 0, scale: 1.03 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(cur, { clearProps: "all" });
            gsap.set(nx, { clearProps: "zIndex,transform" });
          },
        },
      );
      requestAnimationFrame(() =>
        gsap.fromTo(
          [el.querySelector(".gal-t"), el.querySelector(".gal-d")],
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.05 },
        ),
      );
    }
    setActive(next);
  };

  return (
    <div
      className="gal"
      ref={root}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        go(active + (e.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div className="gal-view">
        {p.shots.map((s, k) => (
          <img
            key={s.file}
            className={k === active ? "gal-img on" : "gal-img"}
            src={s.src}
            srcSet={imageSrcSet(s)}
            sizes="(max-width: 860px) 94vw, 950px"
            width={1800}
            height={1125}
            alt={s.alt}
            loading={k === 0 ? "eager" : "lazy"}
            decoding="async"
            aria-hidden={k === active ? undefined : true}
          />
        ))}
        <button type="button" className="gal-arw prev" aria-label="Previous screen" onClick={() => go(active - 1)}>
          <Icon name="back" />
        </button>
        <button type="button" className="gal-arw next" aria-label="Next screen" onClick={() => go(active + 1)}>
          <Icon name="arrow" />
        </button>
      </div>
      <div className="gal-bar">
        <div className="gal-cap" aria-live="polite">
          <span className="gal-n">
            {pad2(active + 1)} / {pad2(n)}
          </span>
          <b className="gal-t">{sh.label}</b>
          <p className="gal-d">{sh.caption}</p>
        </div>
        <a className="gal-full" href={sh.src} target="_blank" rel="noopener noreferrer">
          <MarkupIcon name="expand" />
          Full size
        </a>
      </div>
      <div className="gal-thumbs">
        {p.shots.map((s, k) => (
          <button
            type="button"
            key={s.file}
            className={k === active ? "gal-th on" : "gal-th"}
            aria-pressed={k === active}
            onClick={() => go(k)}
          >
            <img
              src={s.srcSm}
              srcSet={imageSrcSet(s)}
              sizes="(max-width: 860px) 44vw, 220px"
              width={960}
              height={600}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span>
              {s.label}
              <small>{s.theme === "dark" ? "Dark" : "Light"}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="gal-note">
        <MarkupIcon name="info" />
        Redesigned interface screens, shown with sample data.
      </p>
    </div>
  );
}
