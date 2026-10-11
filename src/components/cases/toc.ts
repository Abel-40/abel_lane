import type { CaseStudy } from "@/content/types";
import type { TocItem } from "./CaseReader";

/** Table of contents from the case study's frontmatter sections, or the outline for unwritten ones. */
export function tocFor(c: CaseStudy): TocItem[] {
  return c.sections
    ? c.sections.map((s) => ({ id: `rd-${s.key.toLowerCase()}`, n: s.n, label: s.key }))
    : [{ id: "rd-outline", n: "00", label: "Outline" }];
}
