import { expect, type Page } from "@playwright/test";

export const ROUTES = [
  "/",
  "/about",
  "/projects",
  "/projects/moodverse",
  "/case-studies",
  "/case-studies/moodverse",
  "/case-studies/seo-maker",
  "/contact",
];

/** Skip the once-per-session loader so tests start on the page itself. */
export async function skipLoader(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("abel-loader-seen", "1");
    } catch {
      /* ignore */
    }
  });
}

/** Collect console errors and page errors for the test. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  // WebKit reports RSC prefetches cancelled by a navigation as "access control" errors; they are not failures.
  const benign = (m: string) => /_rsc=.*access control checks/.test(m);
  page.on("pageerror", (e) => !benign(e.message) && errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !benign(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function waitForShutterIdle(page: Page) {
  await expect(page.locator(".shutter")).toHaveCSS("visibility", "hidden", { timeout: 8000 });
}

export async function focusedTag(page: Page) {
  return page.evaluate(() => document.activeElement?.tagName ?? "");
}
