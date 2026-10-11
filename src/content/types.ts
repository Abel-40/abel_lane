/* Content model. Data files in this folder are generated from reference/content.json and
   reference/icons.json by `pnpm gen:content` — edit the JSON (or this file), never the output. */

export type ProjectId = "insight" | "mood" | "seo" | "alert" | "work";
export type ProjectSlug = "insight-stream" | "moodverse" | "seo-maker" | "alertchain" | "workroom";
export type ProjectCategory = "ai" | "async" | "fullstack" | "mobile";
export type CaseStatus = "Published" | "In writing" | "Planned";

/** A project screen: 16:10 WebP in two sizes (images kit, data/project-screens.json). */
export interface Shot {
  file: string;
  label: string;
  theme: "light" | "dark";
  caption: string;
  alt: string;
  src: string;
  srcSm: string;
  width: 1800;
  height: 1125;
}

/** A case-study figure (images kit, data/case-figures.json). The image carries its own "Illustrative figure" footnote. */
export interface CaseFigure {
  file: string;
  label: string;
  caption: string;
  alt: string;
  theme: "light" | "dark";
  src: string;
  srcSm: string;
  width: 1800;
  height: 1125;
}

export interface StackGroup {
  label: string;
  items: readonly string[];
}

export interface Project {
  id: ProjectId;
  slug: ProjectSlug;
  num: string;
  name: string;
  tagline: string;
  /**
   * Per-project URLs, null until Abel supplies them (TODO-ABEL.md). `live`: the deployed product, shown as
   * "Visit live site" on the project page. `repo`: its repository; the GitHub button falls back to the profile.
   */
  links: { live: string | null; repo: string | null };
  /** Two cover colours for the tinted panel behind the stacked screens. */
  hue: readonly [string, string];
  /** Indexes into `shots` for the stacked pair on cards and the hero. */
  cover: { front: number; back: number };
  /** Four redesigned interface screens (sample data), in gallery order. */
  shots: readonly Shot[];
  cats: readonly ProjectCategory[];
  kindLabel: string;
  caseId: ProjectId;
  /** Free text: "In development", "Adding an AI trading assistant", … or null. */
  status: string | null;
  role: string | null;
  hook: string;
  meet: string;
  what: string;
  features: readonly string[];
  chips: readonly string[];
  flow: readonly string[];
  stack: readonly StackGroup[];
}

export interface CaseCode {
  title: string;
  lang: "ts" | "python";
  src: string;
}

/** One section of a written case study. Blocks render in this order: body, points, decisions, code, parts. */
export interface CaseSection {
  n: string;
  key: "Context" | "Design" | "Implementation" | "Validation" | "Reflection";
  title: string;
  body?: string;
  points?: readonly string[];
  decisions?: readonly { chose: string; over: string; why: string }[];
  code?: CaseCode;
  parts?: readonly { title: string; body: string; code?: CaseCode }[];
}

export interface CaseStudy {
  id: ProjectId;
  slug: ProjectSlug;
  projectId: ProjectId;
  num: string;
  project: string;
  status: CaseStatus;
  read: string;
  title: string;
  q: string;
  covers: readonly string[];
  /** The write-up (src/content/case-studies.json). Without it the reader shows the `covers` outline. */
  sections?: readonly CaseSection[];
  figure: CaseFigure;
}

export interface ExperienceItem {
  period: string;
  role: string;
  org: string;
  note: string;
  year: string;
  chips: readonly string[];
  current: boolean;
}

export interface HistoryItem {
  period: string;
  label: string;
  org: string;
  head?: boolean;
  items: readonly string[];
}

export type ToolGroupId = "backend" | "data" | "ai" | "frontend" | "cloud" | "workflow";

export interface Tool {
  name: string;
  /** Brand key in `brandIcons`, or "g:<key>" for a generic stroke icon in `genericIcons`. */
  icon: string;
}

export interface ToolGroup {
  id: ToolGroupId;
  label: string;
  tools: readonly Tool[];
}

export interface RuleTag {
  label: string;
  /** A project id opens that project; "about" goes to /about. */
  target: ProjectId | "about";
}

export interface Rule {
  icon: string;
  title: string;
  desc: string;
  proof: string;
  tags: readonly RuleTag[];
}

export interface JourneyStage {
  title: string;
  tech: string;
  state: string;
  desc: string;
  code: string;
}

export interface JourneyNode {
  s: number;
  k: string;
  node: string;
  sub: string;
  ic: string;
  x: number;
  y: number;
  side?: boolean;
}

export interface ConsoleScenario {
  p: string;
  path: string;
  req: string;
  sp: readonly [string, string, string];
  ms: readonly [number, number, number];
  p95: number;
  res: readonly string[];
}

export interface BrandIcon {
  /** viewBox */
  v: string;
  /** path data */
  d: string;
  /** brand hex */
  h: string;
  /** on-brand colour */
  o: string;
  /** n = normal, d = dark-on-light (use currentColor), l = light (mix with navy in light mode) */
  k: "n" | "d" | "l";
}
