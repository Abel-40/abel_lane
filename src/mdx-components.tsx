import type { MDXComponents } from "mdx/types";
import { ProjectLink } from "@/components/projects/ProjectLink";
import { Icon } from "@/components/ui/Icon";

/* Case-study MDX components. Markdown paragraphs/lists map to the reader styles; the custom tags keep
   unwritten parts visibly marked as TODO for Abel (never filled with invented content). */

/** A bracketed placeholder that still needs writing. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="ph" data-todo="">
      <span className="sr-only">To do: </span>
      {children}
    </span>
  );
}

function Section({ n, k, title, children }: { n: string; k: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rd-sec" id={`rd-${k.toLowerCase()}`}>
      <p className="rd-k">
        {n} {k}
      </p>
      <h2 className="rd-h">{title}</h2>
      {children}
    </section>
  );
}

function Todos({ children }: { children: React.ReactNode }) {
  return <div className="todo">{children}</div>;
}

function Todo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <b>{label}</b>
      <Placeholder>{children}</Placeholder>
    </div>
  );
}

function Metrics({ children }: { children: React.ReactNode }) {
  return <div className="metrics">{children}</div>;
}

function Metric({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <div className="metric">
      <Placeholder>{value}</Placeholder>
      <span>{children}</span>
    </div>
  );
}

/** Unwritten case study: what it will cover, plus a link to the project. */
function Outline({ project, children }: { project: string; children: React.ReactNode }) {
  return (
    <section className="rd-sec" id="rd-outline">
      <p className="rd-k">Outline</p>
      <h2 className="rd-h">What this case study covers</h2>
      {children}
      <p className="rd-p">The full write-up is in progress. Until then, the project page has the product story, flow and stack.</p>
      <div className="btn-row">
        <ProjectLink slug={project} from=".btn" className="btn btn-accent">
          See the project <Icon name="arrow" className="ico-arrow" />
        </ProjectLink>
      </div>
    </section>
  );
}

const components: MDXComponents = {
  p: (props) => <p className="rd-p" {...props} />,
  ul: (props) => <ul className="rd-list" {...props} />,
  li: ({ children }) => (
    <li>
      <Icon name="check" />
      <span>{children}</span>
    </li>
  ),
  Section,
  Todos,
  Todo,
  Metrics,
  Metric,
  Outline,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
