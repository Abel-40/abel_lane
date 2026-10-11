"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { pageIntro } from "@/lib/anim";
import { gsap } from "@/lib/gsap";
import { useIntroGSAP } from "@/hooks/useIntroGSAP";
import { Clock } from "@/components/ui/Clock";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { Icon } from "@/components/ui/Icon";
import { ContactForm } from "./ContactForm";

/** Contact page (reference INIT.contact): heading, details list, "Open to" chips and the glass form card. */
export function ContactView() {
  const root = useRef<HTMLElement>(null);

  useIntroGSAP(
    () => {
      let startIntro: ((covered: boolean) => void) | null = null;
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ paused: true });
        tl.add(pageIntro(el), 0)
          .from(el.querySelectorAll(".ct-item"), { x: -30, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.6)
          .from(el.querySelectorAll(".open-to > *"), { y: 14, opacity: 0, duration: 0.5, stagger: 0.05 }, 1)
          .from(el.querySelector(".fcard"), { x: 60, rotation: 2, opacity: 0, duration: 1.1, ease: "power3.out" }, 0.3);
        startIntro = (covered) => void (covered ? tl.play() : tl.progress(1));
      });
      return { start: (covered: boolean) => startIntro?.(covered) };
    },
    { scope: root },
  );

  return (
    <main className="page" data-page="contact">
      <section className="wrap ct" ref={root}>
        <div>
          <p className="kicker">Contact</p>
          <h1 className="h1 ct-title" data-split="" tabIndex={-1}>
            Let’s build something reliable.
          </h1>
          <p className="lead hero-fade">
            Hiring for a backend or AI role, or need a FastAPI service built? Send a note. I usually reply within 24
            hours.
          </p>
          <ul className="ct-list">
            <li className="ct-item">
              <span className="ct-k">Email</span>
              <span className="ct-v email-text">{site.email}</span>
              <CopyEmailButton />
            </li>
            <li className="ct-item">
              <span className="ct-k">GitHub</span>
              <a className="ct-v" href={site.github.href} target="_blank" rel="noopener noreferrer">
                {site.github.label}
              </a>
              <Icon name="out" className="ico-out" />
            </li>
            <li className="ct-item">
              <span className="ct-k">LinkedIn</span>
              <a className="ct-v" href={site.linkedin.href} target="_blank" rel="noopener noreferrer">
                {site.linkedin.label}
              </a>
              <Icon name="out" className="ico-out" />
            </li>
            <li className="ct-item">
              <span className="ct-k">Local time</span>
              <span className="ct-v">
                <Clock as="span" /> in Addis Ababa
              </span>
              <span className="ct-k">UTC+3</span>
            </li>
          </ul>
          <div className="open-to">
            <span>Open to</span>
            <span className="chip">Remote backend roles</span>
            <span className="chip">AI systems roles</span>
            <span className="chip">Freelance projects</span>
          </div>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
