/* Site-wide facts. Source: reference/index.html markup and PROMPT.md §6 (never invent new ones). */

export const site = {
  name: "Abel Addis",
  role: "Backend Engineer, AI Systems",
  title: "Abel Addis | Backend Engineer, AI Systems",
  description:
    "Abel Addis, backend engineer building the systems behind AI products: FastAPI, Django, PostgreSQL, async workers, retrieval and LLM integrations.",
  email: "addis0132@gmail.com",
  github: { href: "https://github.com/Abel-40", label: "github.com/Abel-40" },
  linkedin: { href: "https://www.linkedin.com/in/abel-addis", label: "linkedin.com/in/abel-addis" },
  timeZone: "Africa/Addis_Ababa",
  country: "Ethiopia",
  footerBio:
    "Backend engineer building the systems behind AI products. Based in Ethiopia, open to remote work.",
} as const;

export type RouteKey = "home" | "about" | "projects" | "cases" | "contact";

export interface NavRoute {
  key: RouteKey;
  href: string;
  label: string;
}

export const navRoutes: readonly NavRoute[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "about", href: "/about", label: "About" },
  { key: "projects", href: "/projects", label: "Projects" },
  { key: "cases", href: "/case-studies", label: "Case Studies" },
  { key: "contact", href: "/contact", label: "Contact" },
];

/** Which nav item is active for a pathname. */
export function routeKeyFor(pathname: string): RouteKey | null {
  if (pathname === "/") return "home";
  const hit = navRoutes.find((r) => r.href !== "/" && (pathname === r.href || pathname.startsWith(r.href + "/")));
  return hit ? hit.key : null;
}
