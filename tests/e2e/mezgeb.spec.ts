import { expect, test } from "@playwright/test";
import { skipLoader, trackErrors } from "./helpers";

/* Mezgeb (/mezgeb): hidden entry, isolation from the portfolio, sign-in guard, PWA wiring and offline page.
   Runs against a production build. Signing in needs a real Supabase project, so it is not covered here. */

test("the footer has one quiet private-area dot that leads to the Mezgeb login", async ({ page }) => {
  await skipLoader(page);
  await page.goto("/");
  const dot = page.locator('.foot a[aria-label="Private area"]');
  await expect(dot).toHaveCount(1);
  await expect(dot).toHaveAttribute("href", "/mezgeb/login");
  const box = await dot.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(24);
  expect(box?.height).toBeGreaterThanOrEqual(24);
  // the visible mark is a 6px dot at low opacity
  const mark = dot.locator("span");
  await expect(mark).toHaveCSS("width", "6px");
  expect(Number(await mark.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.3);

  await dot.scrollIntoViewIfNeeded();
  await dot.hover();
  // the custom cursor ring (desktop only) must not react to it
  if (await page.locator("html.has-cursor").count()) await expect(page.locator(".cursor")).not.toHaveClass(/is-link/);

  await dot.click();
  await expect(page).toHaveURL(/\/mezgeb\/login$/);
  await expect(page.getByRole("heading", { name: "Mezgeb" })).toBeVisible();
});

test("Mezgeb pages load none of the portfolio and stay out of search", async ({ page, request }) => {
  const errors = trackErrors(page);
  await page.goto("/mezgeb/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByText("No sign-up here.", { exact: false })).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/mz/);
  await expect(page.locator(".nav, .foot, .loader, .cursor, .shutter")).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/mezgeb/manifest.webmanifest");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);

  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(robots).not.toContain("mezgeb");
  expect(sitemap).not.toContain("mezgeb");
  expect(errors).toEqual([]);
});

test("the portfolio never links the Mezgeb manifest or service worker", async ({ page }) => {
  await skipLoader(page);
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  expect(await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0)).toBe(0);
});

test("every app page sends a signed-out visitor to the login", async ({ page }) => {
  for (const path of ["/mezgeb", "/mezgeb/add", "/mezgeb/accounts", "/mezgeb/settings", "/mezgeb/wishlist"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/mezgeb\/login$/);
  }
});

test("the service worker installs on Mezgeb and shows the offline page without a network", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "service worker offline check runs in Chromium");
  await page.goto("/mezgeb/login");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope);
  expect(scope).toMatch(/\/mezgeb$/);

  await context.setOffline(true);
  await page.goto("/mezgeb/never-visited").catch(() => {});
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  await context.setOffline(false);
});

test("manifest is scoped to /mezgeb and opens full-screen", async ({ request }) => {
  const manifest = await (await request.get("/mezgeb/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ start_url: "/mezgeb", scope: "/mezgeb", display: "standalone", theme_color: "#0E1311" });
  for (const icon of manifest.icons as { src: string }[]) expect((await request.get(icon.src)).ok()).toBe(true);
});
