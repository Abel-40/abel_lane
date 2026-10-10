import { cases } from "./cases";
import { projects } from "./projects";
import type { CaseStudy, Project, ProjectId } from "./types";

export { cases } from "./cases";
export { experience } from "./experience";
export { history } from "./history";
export { journeyNodes, journeyStages } from "./journey";
export { marqueeRows } from "./marquee";
export { projects } from "./projects";
export { rules } from "./rules";
export { toolGroups } from "./stack";
export { consoleScenarios, heroStackChips, rotatingWords } from "./hero-console";
export * from "./types";

export function projectById(id: ProjectId): Project {
  const p = projects.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown project id: ${id}`);
  return p;
}

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((x) => x.slug === slug);
}

export function caseById(id: ProjectId): CaseStudy {
  const c = cases.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown case id: ${id}`);
  return c;
}

export function caseBySlug(slug: string): CaseStudy | undefined {
  return cases.find((x) => x.slug === slug);
}

/** Previous / next project in list order (wraps), as in the reference overlay. */
export function siblingProjects(id: ProjectId): { prev: Project; next: Project } {
  const i = projects.findIndex((x) => x.id === id);
  const n = projects.length;
  return { prev: projects[(i - 1 + n) % n], next: projects[(i + 1) % n] };
}

export function projectHref(p: Pick<Project, "slug">): string {
  return `/projects/${p.slug}`;
}

export function caseHref(c: Pick<CaseStudy, "slug">): string {
  return `/case-studies/${c.slug}`;
}
