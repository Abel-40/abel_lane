import { expect, test } from "@playwright/test";
import { ROUTES, skipLoader, trackErrors } from "./helpers";

/* Cross-browser smoke (Firefox, WebKit): every route renders its h1 without errors. */
test("routes render without errors", async ({ page }) => {
  await skipLoader(page);
  const errors = trackErrors(page);
  for (const path of ROUTES) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
