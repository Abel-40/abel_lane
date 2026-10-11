import type { CaseSection, CaseStudy, Project } from "@/content/types";
import { ProjectLink } from "@/components/projects/ProjectLink";
import { Icon } from "@/components/ui/Icon";

/** A bracketed placeholder Abel still has to write. Visibly marked TODO, never filled with invented content. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="ph" data-todo="">
      <span className="sr-only">To do: </span>
      {children}
    </span>
  );
}

export const sectionId = (s: Pick<CaseSection, "key">) => `rd-${s.key.toLowerCase()}`;

export function tocFor(c: CaseStudy) {
  return c.sections
    ? c.sections.map((s) => ({ id: sectionId(s), n: s.n, label: s.key }))
    : [{ id: "rd-outline", n: "00", label: "Outline" }];
}

/** Reader body from typed content (reference readerHTML). */
export function CaseSections({ c, project }: { c: CaseStudy; project: Project }) {
  if (!c.sections) {
    return (
      <section className="rd-sec" id="rd-outline">
        <p className="rd-k">Outline</p>
        <h2 className="rd-h">What this case study covers</h2>
        <ul className="rd-list">
          {c.covers.map((t) => (
            <li key={t}>
              <Icon name="check" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="rd-p">The full write-up is in progress. Until then, the project page has the product story, flow and stack.</p>
        <div className="btn-row">
          <ProjectLink slug={project.slug} from=".btn" className="btn btn-accent">
            See the project <Icon name="arrow" className="ico-arrow" />
          </ProjectLink>
        </div>
      </section>
    );
  }
  return (
    <>
      {c.sections.map((s) => (
        <section className="rd-sec" id={sectionId(s)} key={s.key}>
          <p className="rd-k">
            {s.n} {s.key}
          </p>
          <h2 className="rd-h">{s.title}</h2>
          {s.body && <p className="rd-p">{s.body}</p>}
          {s.points && (
            <ul className="rd-list">
              {s.points.map((t) => (
                <li key={t}>
                  <Icon name="check" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
          {s.todo && (
            <div className="todo">
              {s.todo.map((t) => (
                <div key={t.label}>
                  <b>{t.label}</b>
                  <Placeholder>{t.placeholder}</Placeholder>
                </div>
              ))}
            </div>
          )}
          {s.metrics && (
            <div className="metrics">
              {s.metrics.map((m) => (
                <div className="metric" key={m.label}>
                  <Placeholder>{m.placeholder}</Placeholder>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
