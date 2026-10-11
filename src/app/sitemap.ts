import type { MetadataRoute } from "next";
import { cases, projects } from "@/content";
import { absolute, personImage } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, images?: string[]): MetadataRoute.Sitemap[number] => ({
    url: absolute(path),
    lastModified: now,
    changeFrequency: "monthly",
    priority,
    ...(images ? { images } : {}),
  });
  const photo = [absolute(personImage.path)];
  return [
    page("/", 1, photo),
    page("/about", 0.9, photo),
    page("/projects", 0.9),
    ...projects.map((p) => page(`/projects/${p.slug}`, 0.7)),
    page("/case-studies", 0.8),
    ...cases.map((c) => page(`/case-studies/${c.slug}`, c.status === "Published" ? 0.7 : 0.4)),
    page("/contact", 0.6),
  ];
}
