/**
 * One-time migration: reference/content.json › cases → src/content/case-studies/<slug>.mdx.
 * After this, the MDX files are the source of truth for case studies (`pnpm gen:content` reads their
 * frontmatter to build the typed index in src/content/cases.ts). Kept for the record; re-running it
 * overwrites the MDX files.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";

const content = JSON.parse(readFileSync(join(process.cwd(), "reference/content.json"), "utf8"));
const SLUGS: Record<string, string> = {
  insight: "insight-stream",
  mood: "moodverse",
  seo: "seo-maker",
  alert: "alertchain",
  work: "workroom",
};
const outDir = join(process.cwd(), "src/content/case-studies");
mkdirSync(outDir, { recursive: true });

type Section = {
  n: string;
  key: string;
  title: string;
  body?: string;
  points?: string[];
  todo?: [string, string][];
  metrics?: [string, string][];
};

const attr = (s: string) => s.replace(/"/g, "&quot;");

for (const c of content.cases as (Record<string, unknown> & { id: string; sections?: Section[]; covers: string[] })[]) {
  const slug = SLUGS[c.id];
  const fm: Record<string, unknown> = {
    id: c.id,
    slug,
    projectId: c.projectId,
    num: c.num,
    project: c.project,
    status: c.status,
    read: c.read || "",
    title: c.title,
    q: c.q,
    covers: c.covers,
  };
  if (c.sections) fm.sections = c.sections.map((s) => ({ n: s.n, key: s.key, title: s.title }));
  let body = "";
  if (c.sections) {
    for (const s of c.sections) {
      body += `<Section n="${s.n}" k="${s.key}" title="${attr(s.title)}">\n\n`;
      if (s.body) body += `${s.body}\n\n`;
      if (s.points) body += s.points.map((p) => `- ${p}`).join("\n") + "\n\n";
      if (s.todo) {
        body += "<Todos>\n";
        body += s.todo.map(([label, ph]) => `  <Todo label="${attr(label)}">${ph}</Todo>`).join("\n");
        body += "\n</Todos>\n\n";
      }
      if (s.metrics) {
        body += "<Metrics>\n";
        body += s.metrics.map(([ph, label]) => `  <Metric value="${attr(ph)}">${label}</Metric>`).join("\n");
        body += "\n</Metrics>\n\n";
      }
      body += "</Section>\n\n";
    }
  } else {
    body += `<Outline project="${SLUGS[c.projectId as string]}">\n\n`;
    body += c.covers.map((t) => `- ${t}`).join("\n") + "\n\n";
    body += "</Outline>\n";
  }
  const header = `{/* Case study ${c.num}. Sections still in [ brackets ] are placeholders for Abel to write; they render as visible TODOs. */}\n\n`;
  writeFileSync(join(outDir, `${slug}.mdx`), `---\n${stringify(fm, { lineWidth: 0 })}---\n\n${header}${body}`);
  console.log("wrote", `${slug}.mdx`);
}
