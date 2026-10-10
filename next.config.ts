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

export default nextConfig;
