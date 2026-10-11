import { z } from "zod";

const code = z.object({ title: z.string().min(1), lang: z.enum(["ts", "python"]), src: z.string().min(1) });

const section = z.object({
  n: z.string().regex(/^\d{2}$/),
  key: z.enum(["Context", "Design", "Implementation", "Validation", "Reflection"]),
  title: z.string().min(1),
  body: z.string().optional(),
  points: z.array(z.string()).optional(),
  decisions: z.array(z.object({ chose: z.string(), over: z.string(), why: z.string() })).optional(),
  code: code.optional(),
  parts: z.array(z.object({ title: z.string(), body: z.string(), code: code.optional() })).optional(),
});

/** One case in src/content/case-studies.json (validated by `pnpm gen:content`). Edit that file to change the write-ups. */
export const caseEntry = z.object({
  id: z.enum(["insight", "mood", "seo", "alert", "work"]),
  projectId: z.enum(["insight", "mood", "seo", "alert", "work"]),
  num: z.string().regex(/^\d{2}$/),
  project: z.string().min(1),
  status: z.enum(["Published", "In writing", "Planned"]),
  read: z.string().default(""),
  title: z.string().min(1),
  q: z.string().min(1),
  covers: z.array(z.string()).min(1),
  sections: z.array(section).optional(),
  figure: z.object({
    file: z.string(),
    label: z.string(),
    caption: z.string(),
    alt: z.string(),
    theme: z.enum(["light", "dark"]),
    src: z.string(),
    srcSm: z.string(),
    width: z.literal(1800),
    height: z.literal(1125),
  }).passthrough(),
});

export const caseFile = z.object({ cases: z.array(caseEntry).length(5) });
