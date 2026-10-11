"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";

/** On-brand 404: the route shutter's label answers `GET /path 404` on the navy band. */
export function NotFoundView() {
  const path = usePathname() || "/…";
  return (
    <main className="page" data-page="404">
      <section className="nf on-deep">
        <div className="wrap nf-in">
          <p className="sh-line nf-line" aria-hidden="true">
            <span className="sh-verb">GET</span>
            <span className="nf-path">{path}</span>
            <span className="nf-code">404</span>
          </p>
          <h1 className="h1 nf-title" tabIndex={-1}>
            Nothing is served at this path.
          </h1>
          <p className="lead nf-lead">The page doesn’t exist, or it has moved. Pick up from one of these instead.</p>
          <div className="btn-row">
            <TransitionLink href="/" className="btn btn-light">
              Back home <Icon name="arrow" className="ico-arrow" />
            </TransitionLink>
            <TransitionLink href="/projects" className="btn btn-ghost-deep">
              See the projects
            </TransitionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
