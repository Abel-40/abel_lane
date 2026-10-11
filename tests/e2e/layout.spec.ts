import { expect, test } from "@playwright/test";
import { ROUTES, skipLoader, trackErrors } from "./helpers";

const WIDTHS = [360, 390, 768, 900, 1024, 1280, 1440, 1920];

test("no horizontal overflow from 360 to 1920px, no console errors", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "runs once on desktop with explicit widths");
  test.setTimeout(300_000);
  await skipLoader(page);
  const errors = trackErrors(page);
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const path of ROUTES) {
      await page.goto(path);
      await page.waitForTimeout(250);
      // scroll through the page so pinned sections and reveals run
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${w}px overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  }
  expect(errors).toEqual([]);
});

test("pinned sections recover after a resize", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "desktop pins");
  await skipLoader(page);
  await page.goto("/");
  // sections set themselves up lazily as they near the viewport: scroll through the page first
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await expect(page.locator(".pin-spacer")).toHaveCount(2);
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  await expect(page.locator(".pin-spacer")).toHaveCount(2);
  const journey = await page.locator(".journey .pin-spacer").evaluate((el) => el.getBoundingClientRect().height);
  expect(journey).toBeGreaterThan(900 * 3.5); // band (one viewport) + 2.8 viewport heights of scroll
});
