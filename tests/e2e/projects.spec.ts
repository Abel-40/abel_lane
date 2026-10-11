import { expect, test } from "@playwright/test";
import { skipLoader } from "./helpers";

test.beforeEach(async ({ page }) => skipLoader(page));

test("filters update aria-pressed, the count and the grid", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator(".f-count")).toHaveText("Showing 5 of 5");
  const mobile = page.getByRole("button", { name: "Mobile" });
  await mobile.click();
  await expect(mobile).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".f-count")).toHaveText("Showing 1 of 5");
  await expect(page.locator(".pcell:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "AI and retrieval" }).click();
  await expect(page.locator(".f-count")).toHaveText("Showing 4 of 5");
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".f-count")).toHaveText("Showing 5 of 5");
});

test("project overlay: open, prev/next, breadcrumb, Esc, focus", async ({ page }) => {
  await page.goto("/projects");
  await page.locator(".pcard").nth(1).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/moodverse$/);
  await expect(dialog.locator("#poName")).toHaveText("MoodVerse");
  await expect(dialog.locator("#poName")).toBeFocused();

  await dialog.getByRole("button", { name: "Next project" }).click();
  await expect(dialog.locator("#poName")).toHaveText("SEO Maker");
  await expect(page).toHaveURL(/\/projects\/seo-maker$/);
  await dialog.getByRole("button", { name: "Previous project" }).click();
  await expect(dialog.locator("#poName")).toHaveText("MoodVerse");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/projects$/);

  await page.locator(".pcard").nth(0).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "projects" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/projects$/);
});

test("overlay from Home: breadcrumb goes to /projects", async ({ page }) => {
  await page.goto("/");
  await page.locator(".wcard a.btn").first().evaluate((a: HTMLElement) => a.click());
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "projects" }).click();
  await page.waitForURL("**/projects");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("h1")).toContainText("Five products");
});

test("deep link renders the full project page; next switches in place", async ({ page }) => {
  await page.goto("/projects/alertchain");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("h1#poName")).toHaveText("AlertChain");
  await page.getByRole("button", { name: "Next project" }).click();
  await expect(page.locator("h1#poName")).toHaveText("Workroom");
  await expect(page).toHaveURL(/\/projects\/workroom$/);
  await page.goBack();
  await expect(page.locator("h1#poName")).toHaveText("AlertChain");
});
