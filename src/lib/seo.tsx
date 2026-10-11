import { site } from "@/content/site";
import type { Project } from "@/content/types";

/** Absolute site origin: NEXT_PUBLIC_SITE_URL, else the Vercel production URL, else localhost. */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const absolute = (path: string) => `${siteUrl()}${path === "/" ? "" : path}`;

/** schema.org Person — facts only from the reference (PROMPT §6). */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl()}/#person`,
    name: site.name,
    jobTitle: site.role,
    url: siteUrl(),
    email: `mailto:${site.email}`,
    sameAs: [site.github.href, site.linkedin.href],
    address: { "@type": "PostalAddress", addressCountry: "ET" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Arba Minch University" },
    hasCredential: { "@type": "EducationalOccupationalCredential", name: "AWS Certified Cloud Practitioner" },
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped so it can never close the script element
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

/** Per-page metadata: title, description, canonical, Open Graph and Twitter in one place. */
export function pageMeta({
  path,
  title,
  description,
  type = "website",
}: {
  path: string;
  title?: string;
  description: string;
  type?: "website" | "article";
}) {
  const full = title ? `${title} | ${site.name}` : site.title;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { type, url: path, title: full, description, siteName: "Abel Addis", locale: "en_US" },
    twitter: { card: "summary_large_image" as const, title: full, description },
  };
}

/** schema.org CreativeWork for a project (facts from content.json only). */
export function projectJsonLd(p: Project) {
  const cover = p.shots[p.cover.front];
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absolute(`/projects/${p.slug}`)}#work`,
    name: p.name,
    headline: p.tagline,
    description: p.meet,
    url: absolute(`/projects/${p.slug}`),
    author: { "@id": `${siteUrl()}/#person` },
    keywords: p.chips.join(", "),
    image: { "@type": "ImageObject", url: absolute(cover.src), width: cover.width, height: cover.height, caption: cover.alt },
    ...(p.status ? { creativeWorkStatus: p.status } : {}),
  };
}

export function projectListJsonLd(list: readonly Project[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: projectJsonLd(p) })),
  };
}
