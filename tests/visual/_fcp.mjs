import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (let i = 0; i < 3; i++) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = Object.fromEntries(performance.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)]));
    const res = performance.getEntriesByType("resource").filter((e) => /\.(css|js|woff2)/.test(e.name)).map((e) => e.name.split("/").pop().slice(0, 18) + "@" + Math.round(e.startTime) + "-" + Math.round(e.responseEnd) + (e.renderBlockingStatus === "blocking" ? "B" : ""));
    return { ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), paints, res: res.join(" ") };
  });
  console.log(JSON.stringify(r));
  await ctx.close();
}
await b.close();
