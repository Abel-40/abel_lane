import { caseById, siblingProjects } from "@/content";
import type { Project } from "@/content/types";
import { site } from "@/content/site";
import { ProjectShots, SHOT_SIZES } from "@/components/imagery/ProjectShots";
import { ScreensGallery } from "@/components/imagery/ScreensGallery";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { FlowPills } from "@/components/ui/FlowPills";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * Project detail content (reference projectHTML): hero, problem, product, capabilities, flow, stack,
 * actions and the next-project link. `onNext` switches in place (overlay / page) instead of navigating.
 */
export function ProjectBody({
  p,
  heading,
  onNext,
}: {
  p: Project;
  heading: "h1" | "h2";
  onNext: (slug: string) => void;
}) {
  const next = siblingProjects(p.id).next;
  const cs = caseById(p.caseId);
  const H = heading;
  const K = heading === "h1" ? "h2" : "h3"; // section labels sit one level under the name
  return (
    <>
      <header className="po-hero">
        <div>
          <div className="po-tags po-in">
            <StatusPill status={p.status} />
            {p.role && <span className="chip">{p.role}</span>}
            <span className="chip">{p.kindLabel}</span>
          </div>
          <H className="po-name po-in" id="poName" tabIndex={-1}>
            {p.name}
          </H>
          <p className="po-tagline po-in">{p.tagline}</p>
        </div>
        <div className="po-art po-in">
          <ProjectShots p={p} sizes={SHOT_SIZES.hero} eager />
        </div>
      </header>
      <section className="po-sec po-in">
        <K className="po-k">The problem</K>
        <p className="po-hook">{p.hook}</p>
      </section>
      <section className="po-sec po-in">
        <K className="po-k">The product</K>
        <div>
          <p className="po-p">{p.meet}</p>
          <p className="po-p">{p.what}</p>
        </div>
      </section>
      <section className="po-sec po-in">
        <K className="po-k">Inside the product</K>
        <ScreensGallery key={p.id} p={p} />
      </section>
      <section className="po-sec po-in">
        <K className="po-k">Key capabilities</K>
        <ul className="feat">
          {p.features.map((f) => (
            <li key={f}>
              <Icon name="check" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="po-sec po-in">
        <K className="po-k">How it flows</K>
        <div>
          <FlowPills steps={p.flow} />
        </div>
      </section>
      <section className="po-sec po-in">
        <K className="po-k">Tech stack</K>
        <div className="sgs">
          {p.stack.map((g) => (
            <div className="sg" key={g.label}>
              <span>{g.label}</span>
              <span className="chips">
                {g.items.map((t) => (
                  <span className="chip" key={t}>
                    {t}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="po-cta po-in">
        <TransitionLink href={`/case-studies/${cs.slug}`} className="btn btn-accent">
          Read the case study <Icon name="arrow" className="ico-arrow" />
        </TransitionLink>
        <a className="btn btn-ghost" href={site.github.href} target="_blank" rel="noopener noreferrer">
          GitHub <Icon name="out" />
        </a>
      </div>
      <a
        className="po-next po-in"
        href={`/projects/${next.slug}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onNext(next.slug);
        }}
      >
        <span>
          <small>Next project</small>
          <b>{next.name}</b>
        </span>
        <Icon name="arrow" />
      </a>
    </>
  );
}
