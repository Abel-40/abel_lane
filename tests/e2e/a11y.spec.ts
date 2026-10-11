import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES, skipLoader } from "./helpers";

/* axe on every route in both themes. Reduced motion renders every element in its final state, so the scan
   never sees half-faded text. Zero serious or critical violations allowed. */
for (const theme of ["light", "dark"] as const) {
  for (const path of ROUTES) {
    test(`axe ${theme} ${path}`, async ({ page }) => {
      await skipLoader(page);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = bad.map(
        (v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 4).map((n) => n.target.join(" ")).join(" | ")}`,
      );
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}
