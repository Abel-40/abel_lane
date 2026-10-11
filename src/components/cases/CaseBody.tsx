import type { CaseCode, CaseSection, CaseStudy } from "@/content/types";
import { ProjectLink } from "@/components/projects/ProjectLink";
import { Icon } from "@/components/ui/Icon";

/** Comments and strings only (the site has no highlighter): `//` for ts, `#` for python, then quoted strings. */
const TOKENS = {
  ts: /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
  python: /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g,
} as const;

function highlight(src: string, lang: CaseCode["lang"]): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = new RegExp(TOKENS[lang]);
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push(src.slice(last, m.index));
    out.push(
      <span key={m.index} className={m[1] ? "cm" : "st"}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

function Code({ code }: { code: CaseCode }) {
  return (
    <figure className="rd-code">
      <figcaption>
        <span>{code.title}</span>
        <span className="rd-code-lang">{code.lang}</span>
      </figcaption>
      {/* tabIndex: a scrollable region must be keyboard-reachable */}
      <pre tabIndex={0}>
        <code>{highlight(code.src, code.lang)}</code>
      </pre>
    </figure>
  );
}

function Section({ s }: { s: CaseSection }) {
  return (
    <section className="rd-sec" id={`rd-${s.key.toLowerCase()}`}>
      <p className="rd-k">
        {s.n} {s.key}
      </p>
      <h2 className="rd-h">{s.title}</h2>
      {s.body && <p className="rd-p">{s.body}</p>}
      {s.points && (
        <ul className="rd-list">
          {s.points.map((p) => (
            <li key={p}>
              <Icon name="check" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {s.decisions && (
        <div className="rd-dec">
          {s.decisions.map((d) => (
            <div className="rd-dec-row" key={d.chose}>
              <div>
                <span className="rd-dec-k">Chose</span>
                <b>{d.chose}</b>
              </div>
              <div>
                <span className="rd-dec-k">Over</span>
                <span className="rd-dec-over">{d.over}</span>
              </div>
              <div>
                <span className="rd-dec-k">Because</span>
                <p>{d.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {s.code && <Code code={s.code} />}
      {s.parts && (
        <div className="rd-parts">
          {s.parts.map((p, i) => (
            <div className="rd-part" key={p.title}>
              <span className="rd-part-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                {p.code && <Code code={p.code} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Fallback for a case with no `sections`: what it will cover, plus a link to the project. */
function Outline({ c }: { c: CaseStudy }) {
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
        <ProjectLink slug={c.slug} from=".btn" className="btn btn-accent">
          See the project <Icon name="arrow" className="ico-arrow" />
        </ProjectLink>
      </div>
    </section>
  );
}

/** Case-study body, rendered from the case's `sections` (data/case-studies.json). */
export function CaseBody({ c }: { c: CaseStudy }) {
  if (!c.sections) return <Outline c={c} />;
  return (
    <>
      {c.sections.map((s) => (
        <Section key={s.key} s={s} />
      ))}
    </>
  );
}
