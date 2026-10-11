import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components keeps hidden routes mounted inside <Activity>. Every page here is static and
  // re-initialises its GSAP timelines on each visit (as the reference does), so classic unmounting
  // keeps ScrollTrigger cleanup, SVG ids and focus handling predictable.
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // One address for search engines: www.abel-addis.com permanently redirects to abel-addis.com (same path)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.abel-addis.com" }],
        destination: "https://abel-addis.com/:path*",
        permanent: true,
      },
    ];
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
