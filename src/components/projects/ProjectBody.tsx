import { caseById, siblingProjects } from "@/content";
import type { Project } from "@/content/types";
import { site } from "@/content/site";
import { ProjectArt } from "@/components/art/ProjectArt";
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
          <ProjectArt art={p.art} />
        </div>
      </header>
      <section className="po-sec po-in">
        <h3 className="po-k">The problem</h3>
        <p className="po-hook">{p.hook}</p>
      </section>
      <section className="po-sec po-in">
        <h3 className="po-k">The product</h3>
        <div>
          <p className="po-p">{p.meet}</p>
          <p className="po-p">{p.what}</p>
        </div>
      </section>
      <section className="po-sec po-in">
        <h3 className="po-k">Key capabilities</h3>
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
        <h3 className="po-k">How it flows</h3>
        <div>
          <FlowPills steps={p.flow} />
        </div>
      </section>
      <section className="po-sec po-in">
        <h3 className="po-k">Tech stack</h3>
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
