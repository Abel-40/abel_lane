import { site } from "@/content/site";
import { toolGroups } from "@/content/stack";
import type { Project } from "@/content/types";

/** Absolute site origin: NEXT_PUBLIC_SITE_URL when set (e.g. a preview), else `url` from data/site.json. */
export function siteUrl(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || site.url;
  return origin.replace(/\/+$/, "");
}

export const absolute = (path: string) => `${siteUrl()}${path === "/" ? "" : path}`;

const personId = () => `${siteUrl()}/#person`;
const websiteId = () => `${siteUrl()}/#website`;

/** The photo search engines show for the Person (public/images/abel-addis.jpg, from src/assets/abel.png). */
export const personImage = { path: "/images/abel-addis.jpg", width: 800, height: 1067 };

/**
 * schema.org Person + WebSite, on every page. The Person is what a search for the name resolves to: the same name,
 * photo and profiles (sameAs) everywhere tie the site, GitHub and LinkedIn to one entity. Facts come from data/.
 */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId(),
        name: site.name,
        jobTitle: site.role,
        description: site.description,
        url: siteUrl(),
        image: {
          "@type": "ImageObject",
          url: absolute(personImage.path),
          width: personImage.width,
          height: personImage.height,
          caption: site.name,
        },
        email: `mailto:${site.email}`,
        sameAs: [site.github.href, site.linkedin.href],
        address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" },
        alumniOf: { "@type": "CollegeOrUniversity", name: "Arba Minch University" },
        hasCredential: { "@type": "EducationalOccupationalCredential", name: "AWS Certified Cloud Practitioner" },
        knowsAbout: toolGroups.flatMap((g) => g.tools.map((t) => t.name)),
      },
      {
        "@type": "WebSite",
        "@id": websiteId(),
        name: site.name,
        alternateName: [`${site.name} Portfolio`, new URL(siteUrl()).hostname],
        url: siteUrl(),
        description: site.description,
        inLanguage: "en",
        author: { "@id": personId() },
        publisher: { "@id": personId() },
      },
    ],
  };
}

/** schema.org ProfilePage for the About page: tells search engines the page is about the Person above. */
export function profilePageJsonLd(path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${absolute(path)}#page`,
    url: absolute(path),
    name: `About ${site.name}`,
    isPartOf: { "@id": websiteId() },
    mainEntity: { "@id": personId() },
    about: { "@id": personId() },
  };
}

/** schema.org BreadcrumbList: `[label, path]` pairs from below the home page down to the current page. */
export function breadcrumbJsonLd(trail: readonly (readonly [string, string])[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as const, ...trail].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absolute(path),
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // every "<" is written as a JSON unicode escape, so the JSON can never close the script element
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Per-page metadata: title, description, canonical, Open Graph and Twitter in one place. */
export function pageMeta({
  path,
  title,
  fullTitle,
  description,
  type = "website",
}: {
  path: string;
  /** Short title; the layout template adds " | Abel Addis". */
  title?: string;
  /** Complete title used as is (no template), e.g. one that starts with the name. */
  fullTitle?: string;
  description: string;
  type?: "website" | "article";
}) {
  const full = fullTitle ?? (title ? `${title} | ${site.name}` : site.title);
  return {
    ...(fullTitle ? { title: { absolute: fullTitle } } : title ? { title } : {}),
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
