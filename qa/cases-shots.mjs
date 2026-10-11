import { chromium } from "@playwright/test";
const base = "http://localhost:3111";
const slugs = ["moodverse", "seo-maker", "insight-stream", "alertchain", "workroom"];
const b = await chromium.launch();
async function ctx(w, h, theme, mobile) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, colorScheme: theme });
  await c.addInitScript((t) => { try { sessionStorage.setItem("abel-loader-seen", "1"); localStorage.setItem("theme", t); localStorage.setItem("abel-theme", t); } catch {} }, theme);
  return c;
}
const errors = [];
for (const [name, w, h, theme, mobile] of [["desktop-light", 1440, 900, "light", false], ["desktop-dark", 1440, 900, "dark", false], ["mobile", 390, 844, "light", true]]) {
  const c = await ctx(w, h, theme, mobile);
  for (const slug of slugs) {
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(`${slug} ${name} pageerror ${e.message}`));
    p.on("console", (m) => m.type() === "error" && errors.push(`${slug} ${name} console ${m.text()}`));
    await p.goto(`${base}/case-studies/${slug}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    // reveal everything for full-page capture
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, secs: document.querySelectorAll(".rd-sec").length, dec: document.querySelectorAll(".rd-dec-row").length, code: document.querySelectorAll(".rd-code").length, parts: document.querySelectorAll(".rd-part").length, theme: document.documentElement.dataset.theme, todo: document.querySelectorAll(".todo,.ph,.metrics").length, title: document.title, desc: document.querySelector('meta[name=description]')?.content?.slice(0, 50), og: document.querySelector('meta[property="og:image"]')?.content }));
    console.log(name, slug, JSON.stringify(m));
    if (slug === "seo-maker" || slug === "moodverse") await p.screenshot({ path: `qa/cases/${slug}-${name}.png`, fullPage: true });
    await p.close();
  }
  await c.close();
}
console.log("ERRORS", errors.length, errors.slice(0, 8));
await b.close();
