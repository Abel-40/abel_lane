// FCP + long tasks under 4x CPU throttling (cold context each run), for quick perf iteration.
import { chromium } from "@playwright/test";
const url = process.argv[2] ?? "http://localhost:3100/";
const b = await chromium.launch();
for (let i = 0; i < 3; i++) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
    window.__lcp = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__lcp = Math.round(e.startTime)))).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => ({ fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1), lcp: window.__lcp, lt: window.__lt.filter((x) => x[1] > 50) }));
  const tbt = r.lt.filter((x) => x[0] > r.fcp).reduce((s, x) => s + Math.max(0, x[1] - 50), 0);
  console.log(`FCP ${r.fcp} LCP ${r.lcp} TBT~${tbt} | ${r.lt.map((x) => x.join("+")).join(" ")}`);
  await ctx.close();
}
await b.close();
