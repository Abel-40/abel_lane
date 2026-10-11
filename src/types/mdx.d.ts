declare module "*.mdx" {
  /** YAML frontmatter, exported by remark-mdx-frontmatter. Validate with caseFrontmatter before use. */
  export const frontmatter: Record<string, unknown>;
}
