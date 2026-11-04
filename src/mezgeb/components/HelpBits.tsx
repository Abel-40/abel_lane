// Building blocks of the static help pages. No hooks and no data: plain markup that prerenders.
import Link from "next/link";
import type { ReactNode } from "react";

/** Where to tap, e.g. <Path steps={["Plan", "+ Add person", "Kind: Money I keep for someone"]} /> */
export function Path({ steps }: { steps: string[] }) {
  return (
    <span className="mz-path" aria-label={`Go to ${steps.join(", then ")}`}>
      {steps.map((s, i) => (
        <span key={i} className="mz-path__step">
          {i > 0 && (
            <span className="mz-path__sep" aria-hidden="true">
              ›
            </span>
          )}
          <b>{s}</b>
        </span>
      ))}
    </span>
  );
}

export function HelpSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mz-help__section">
      <h2 id={`${id}-title`} className="mz-help__h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Example({ children }: { children: ReactNode }) {
  return (
    <div className="mz-help__example">
      <span className="mz-help__example-label">Example</span>
      <div>{children}</div>
    </div>
  );
}

export function Tip({ children }: { children: ReactNode }) {
  return <p className="mz-help__tip">{children}</p>;
}

export function Contents({ items }: { items: { id: string; title: string }[] }) {
  return (
    <nav aria-label="On this page" className="mz-card mz-help__toc">
      <span className="mz-section-label" style={{ margin: 0 }}>
        On this page
      </span>
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`}>{it.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function HelpLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mz-help__link">
      {children}
    </Link>
  );
}
