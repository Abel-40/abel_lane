"use client";

/* The last page (not a project detail) the visitor was on: the overlay's "projects" crumb closes the
   overlay when that page is /projects, and navigates there otherwise. */

let lastPage = "/";

export const isProjectDetailPath = (p: string) => /^\/projects\/[^/]+\/?$/.test(p);

export function setLastPage(path: string) {
  if (!isProjectDetailPath(path)) lastPage = path;
}

export function getLastPage() {
  return lastPage;
}
