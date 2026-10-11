"use client";

import { useIdleGSAP } from "@/hooks/useIdleGSAP";
import { useRef } from "react";
import { site } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { scrollToY } from "@/lib/scroll";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { MarkupIcon } from "@/components/ui/Icon";
import { ThemeToggle } from "./ThemeToggle";

/** Footer: bio, icon buttons, back to top, and a giant "Abel Addis" whose letters rise on scroll (scrub .5). */
export function Footer() {
  const ref = useRef<HTMLElement>(null);

  useIdleGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".foot-name .fl", {
          yPercent: 105,
          ease: "none",
          stagger: 0.06,
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom bottom", scrub: 0.5, refreshPriority: -1 },
        });
      });
    },
    { scope: ref },
  );

  return (
    <footer className="foot" ref={ref}>
      <div className="wrap foot-top">
        <p>{site.footerBio}</p>
        <div className="foot-links">
          <CopyEmailButton variant="icon" />
          <a className="icon-btn" href={site.github.href} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <MarkupIcon name="github" />
          </a>
          <a className="icon-btn" href={site.linkedin.href} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <MarkupIcon name="linkedin" />
          </a>
          <ThemeToggle />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => scrollToY(0, true)}>
            Back to top <MarkupIcon name="up" />
          </button>
        </div>
      </div>
      <div className="foot-name" aria-hidden="true">
        {"Abel Addis".split("").map((c, i) =>
          c === " " ? <span key={i} className="sp" /> : <span key={i} className="fl">{c}</span>,
        )}
      </div>
      <div className="wrap foot-bottom">
        <span>© 2026 Abel Addis</span>
        <span>Backend Engineer, AI Systems</span>
      </div>
    </footer>
  );
}
