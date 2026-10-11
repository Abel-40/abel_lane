import { expect, test } from "@playwright/test";
import { skipLoader } from "./helpers";

test.beforeEach(async ({ page }) => skipLoader(page));

test("tools tabs filter the board", async ({ page }) => {
  await page.goto("/about");
  const tabs = page.getByRole("group", { name: "Tool categories" });
  await expect(page.locator(".tool:visible")).toHaveCount(35);
  const ai = tabs.getByRole("button", { name: /AI and LLMs/ });
  await ai.click();
  await expect(ai).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".tool:visible")).toHaveCount(8);
  await tabs.getByRole("button", { name: /Workflow/ }).click();
  await expect(page.locator(".tool:visible")).toHaveCount(4);
});

test("career log commits expand and collapse", async ({ page }) => {
  await page.goto("/about");
  const first = page.locator(".commit-head").first();
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
});

test("case reader table of contents scrolls and tracks the section", async ({ page }) => {
  await page.goto("/case-studies/moodverse");
  await expect(page.locator(".ph").first()).toContainText("[ Your validation rules and why ]");
  await page.locator(".toc a", { hasText: "Validation" }).click();
  await expect(page.locator(".toc a.on")).toHaveText(/Validation/, { timeout: 8000 });
});

test("contact form validates, then falls back to compose + copy without an API key", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact");
  const send = page.getByRole("button", { name: /Send message/ });
  await send.click();
  await expect(page.locator("#formNote")).toHaveText("Fill in your name, email and message.");
  await expect(page.locator("#f-name")).toBeFocused();
  await page.fill("#f-name", "Test Person");
  await page.fill("#f-email", "not-an-email");
  await page.fill("#f-msg", "Hello");
  await send.click();
  await expect(page.locator("#formNote")).toContainText("Check the email address");
  await page.fill("#f-email", "test@example.com");
  await send.click();
  const done = page.locator(".done");
  await expect(done.getByRole("heading")).toBeVisible({ timeout: 10000 });
  await expect(done.locator("pre")).toContainText("From: Test Person <test@example.com>");
  await expect(done.getByRole("link", { name: "Open in email app" })).toHaveAttribute("href", /^mailto:addis0132@gmail\.com/);
  await done.getByRole("button", { name: "Write another" }).click();
  await expect(page.locator("form.form")).toBeVisible();
});

test("contact API: honeypot is accepted silently, invalid input is rejected", async ({ request }) => {
  const hp = await request.post("/api/contact", {
    data: { name: "x", email: "x@y.co", topic: "A freelance project", message: "hi", company: "bot" },
  });
  expect(await hp.json()).toEqual({ ok: true, mode: "sent" });
  const bad = await request.post("/api/contact", { data: { name: "", email: "no", topic: "nope", message: "" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).mode).toBe("invalid");
});

test("copy email shows a toast and writes the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact");
  await page.locator(".ct-item").getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator(".toast")).toHaveText("Email copied: addis0132@gmail.com");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("addis0132@gmail.com");
});

test("theme toggle cycles and persists without a flash", async ({ page }) => {
  await page.goto("/");
  const btn = page.locator(".foot .theme-btn");
  await btn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await btn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
