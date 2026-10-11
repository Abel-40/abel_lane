import { chromium } from "@playwright/test";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => sessionStorage.setItem("abel-loader-seen", "1"));
await p.goto("http://localhost:3100/projects", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
await p.evaluate(() => window.scrollTo(0, 300)); await p.waitForTimeout(800);
const supports = await p.evaluate(() => "startViewTransition" in document);
await p.locator(".pcard").nth(1).click();
for (const t of [120, 380, 900]) { await p.waitForTimeout(t === 120 ? 120 : t - 120); await p.screenshot({ path: `qa/shots/vt-${t}.jpg`, quality: 60 }); }
console.log("VT supported:", supports, "| dialog:", await p.locator("[role=dialog]").count(), "| art vt name cleared:", await p.evaluate(() => document.querySelector(".po-art")?.style.viewTransitionName === ""));
await b.close();
