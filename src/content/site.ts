/* Site-wide facts live in data/site.json (name, role, email, links, résumé). Navigation is defined below. */
import siteData from "../../data/site.json";

export const site = siteData;

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
