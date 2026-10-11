import { expect, test } from "@playwright/test";
import { focusedTag, skipLoader, trackErrors, waitForShutterIdle } from "./helpers";

test.beforeEach(async ({ page }) => skipLoader(page));

test("nav links play the shutter, move focus to the h1 and support back/forward", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "desktop nav");
  const errors = trackErrors(page);
  await page.goto("/");
  await page.locator("nav.links").getByRole("link", { name: "About" }).click();
  await expect(page.locator(".shutter")).toHaveCSS("visibility", "visible");
  await expect(page.locator(".sh-path")).toHaveText("/about");
  await page.waitForURL("**/about");
  await waitForShutterIdle(page);
  await expect(page.locator("h1")).toContainText("From UI/UX");
  expect(await focusedTag(page)).toBe("H1");
  await expect(page.locator(".link.on")).toHaveText("About");

  await page.locator("nav.links").getByRole("link", { name: "Case Studies" }).click();
  await page.waitForURL("**/case-studies");
  await waitForShutterIdle(page);
  await page.goBack();
  await page.waitForURL("**/about");
  await waitForShutterIdle(page);
  await expect(page.locator("h1")).toContainText("From UI/UX");
  await page.goForward();
  await page.waitForURL("**/case-studies");
  await expect(page.locator("h1")).toContainText("The decisions behind the code");
  expect(errors).toEqual([]);
});

test("mobile menu opens, navigates and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile menu");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("#menu")).toBeVisible();
  await page.locator(".menu-link", { hasText: "Projects" }).click();
  await page.waitForURL("**/projects");
  await expect(page.locator("#menu")).toBeHidden();
  await expect(page.locator("h1")).toContainText("Five products");
});

const DEEP: [string, string][] = [
  ["/about", "From UI/UX"],
  ["/projects", "Five products"],
  ["/projects/workroom", "Workroom"],
  ["/case-studies/seo-maker", "Designing a scalable website intelligence pipeline"],
  ["/contact", "Let’s build something reliable."],
];

for (const [path, heading] of DEEP) {
  test(`deep link ${path} renders its page`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toContainText(heading);
  });
}

test("unknown routes render the on-brand 404", async ({ page }) => {
  const res = await page.goto("/nope/missing");
  expect(res?.status()).toBe(404);
  await expect(page.locator(".nf-code")).toHaveText("404");
  await expect(page.locator(".nf-path")).toHaveText("/nope/missing");
});
