import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = {
  ...defineCloudflareConfig({
    // Every page is prerendered and never revalidated, so the cache is read straight from the deployed static
    // assets (no R2 bucket or KV namespace to create). `pnpm run build` copies it there (populateCache local).
    incrementalCache: staticAssetsIncrementalCache,
  }),
  // `pnpm run build` runs this adapter, so it must not call `build` again: run plain `next build` instead
  // (OpenNext switches it to standalone output first).
  buildCommand: "pnpm run build:next",
};

export default config;
