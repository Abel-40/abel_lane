import { z } from "zod";

/** Typed frontmatter for src/content/case-studies/*.mdx (validated by `pnpm gen:content` and the reader). */
export const caseFrontmatter = z.object({
  id: z.enum(["insight", "mood", "seo", "alert", "work"]),
  slug: z.enum(["insight-stream", "moodverse", "seo-maker", "alertchain", "workroom"]),
  projectId: z.enum(["insight", "mood", "seo", "alert", "work"]),
  num: z.string().regex(/^\d{2}$/),
  project: z.string().min(1),
  status: z.enum(["Published", "In writing", "Planned"]),
  read: z.string().default(""),
  title: z.string().min(1),
  q: z.string().min(1),
  covers: z.array(z.string()).min(1),
  /** Present once the write-up exists; drives the reader's table of contents. */
  sections: z
    .array(z.object({ n: z.string().regex(/^\d{2}$/), key: z.string().min(1), title: z.string().min(1) }))
    .optional(),
});

export type CaseFrontmatter = z.infer<typeof caseFrontmatter>;
