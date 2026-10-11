import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components keeps hidden routes mounted inside <Activity>. Every page here is static and
  // re-initialises its GSAP timelines on each visit (as the reference does), so classic unmounting
  // keeps ScrollTrigger cleanup, SVG ids and focus handling predictable. See PLAN.md › Decisions.
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

/* Case studies are MDX (src/content/case-studies). Plugins are named by string so Turbopack can load them;
   frontmatter is exported as `frontmatter` and validated with Zod (src/content/case-schema.ts). */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter"],
  },
});

export default withMDX(nextConfig);
