/**
 * Visual parity capture: drives the reference (served from reference/ on REF_URL) and the build
 * (NEW_URL) through identical states and writes qa/compare/<id>-ref.jpg and <id>-new.jpg.
 *
 *   pnpm exec serve reference -l 4100     # reference
 *   pnpm build && pnpm start -p 3100      # build (or `pnpm dev`)
 *   pnpm qa:capture [id-filter]
 *
 * The live reference file keeps the UA body margin and lets display:flex beat [hidden]; its shipped
 * screenshots do not, so the same two fixes are injected before capturing it (PARITY D16/D17).
 */
import { chromium, type Browser, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const REF = process.env.REF_URL ?? "http://localhost:4100";
const NEW = process.env.NEW_URL ?? "http://localhost:3100";
const OUT = join(process.cwd(), "qa/compare");
const filter = process.argv[2];

type Side = "ref" | "new";
type Theme = "light" | "dark";
interface Shot {
  id: string;
  viewport: { width: number; height: number };
  theme?: Theme;
  /** route on each side */
  route: { ref: string; new: string };
  /** bring the page into the captured state */
  act?: (p: Page, side: Side) => Promise<void>;
}

const DESK = { width: 1440, height: 900 };
const MOB = { width: 390, height: 844 };

/** Scroll so `selector` sits `offset` px below the viewport top, then let scrubs settle. */
async function scrollTo(p: Page, selector: string, offset = 0, settle = 1800) {
  await p.evaluate(
    ([sel, off]) => {
      const el = [...document.querySelectorAll<HTMLElement>(sel as string)].find((x) => x.offsetParent !== null);
      if (!el) throw new Error("missing " + sel);
      const y = el.getBoundingClientRect().top + window.scrollY - (off as number);
      window.scrollTo(0, y);
    },
    [selector, offset],
  );
  await p.waitForTimeout(settle);
}

/** Scroll in steps (so pinned scrubs and once-triggers fire in order) to an absolute fraction of a pin. */
async function stepScroll(p: Page, to: number, steps = 12) {
  const from = await p.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    await p.evaluate((y) => window.scrollTo(0, y), from + ((to - from) * i) / steps);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(1500);
}

async function pinY(p: Page, pinSel: string, frac: number, lengthVh: number) {
  return p.evaluate(
    ([sel, f, vh]) => {
      const el = document.querySelector<HTMLElement>(sel as string)!;
      // pin-spacer parent keeps the original offset
      const spacer = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
      const top = spacer.getBoundingClientRect().top + window.scrollY;
      return top + window.innerHeight * (vh as number) * (f as number);
    },
    [pinSel, frac, lengthVh],
  );
}

const shots: Shot[] = [
  { id: "d01-home-hero", viewport: DESK, route: { ref: "/", new: "/" } },
  { id: "k01-home-hero", viewport: DESK, theme: "dark", route: { ref: "/", new: "/" } },
  { id: "m01-home-hero", viewport: MOB, route: { ref: "/", new: "/" } },
  {
    id: "m02-home-hero-console",
    viewport: MOB,
    route: { ref: "/", new: "/" },
    act: (p) => scrollTo(p, ".hero-vis", 60),
  },
  {
    id: "d02-home-marquee-statement",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      await stepScroll(p, await p.evaluate(() => document.querySelector<HTMLElement>(".mq")!.getBoundingClientRect().top + scrollY - 60));
    },
  },
  {
    id: "d03-home-journey-database",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => stepScroll(p, await pinY(p, ".jr-pin", 0.36, 2.8), 24),
  },
  {
    id: "k03-home-journey-database",
    viewport: DESK,
    theme: "dark",
    route: { ref: "/", new: "/" },
    act: async (p) => stepScroll(p, await pinY(p, ".jr-pin", 0.36, 2.8), 24),
  },
  {
    id: "d04-home-journey-ai",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => stepScroll(p, await pinY(p, ".jr-pin", 0.8, 2.8), 24),
  },
  { id: "m03-home-journey-list", viewport: MOB, route: { ref: "/", new: "/" }, act: (p) => scrollTo(p, ".jr-list", 120) },
  { id: "d05-home-work-rail", viewport: DESK, route: { ref: "/", new: "/" }, act: (p) => scrollTo(p, ".work-pin", 0, 2200) },
  {
    id: "d06-home-work-rail-scrolled",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      await scrollTo(p, ".work-pin", 0, 600);
      const y = await p.evaluate(() => window.scrollY);
      await stepScroll(p, y + 1100, 14);
    },
  },
  { id: "m04-home-work", viewport: MOB, route: { ref: "/", new: "/" }, act: (p) => scrollTo(p, ".work-track", 90) },
  {
    id: "d07-home-experience",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".xpw")!.getBoundingClientRect().top + scrollY + 150);
      await stepScroll(p, y, 20);
    },
  },
  {
    id: "m05-home-experience",
    viewport: MOB,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".xpw")!.getBoundingClientRect().top + scrollY - 40);
      await stepScroll(p, y, 20);
    },
  },
  {
    id: "d08-home-how-i-build",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => (document.querySelectorAll<HTMLElement>(".rule")[2].getBoundingClientRect().top + scrollY - 280));
      await stepScroll(p, y, 24);
    },
  },
  {
    id: "k08-home-how-i-build",
    viewport: DESK,
    theme: "dark",
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => (document.querySelectorAll<HTMLElement>(".rule")[2].getBoundingClientRect().top + scrollY - 280));
      await stepScroll(p, y, 24);
    },
  },
  {
    id: "m06-home-how-i-build",
    viewport: MOB,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => (document.querySelectorAll<HTMLElement>(".rule")[1].getBoundingClientRect().top + scrollY - 300));
      await stepScroll(p, y, 24);
    },
  },
  {
    id: "d09-home-case-band",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".case-band")!.getBoundingClientRect().top + scrollY - 0);
      await stepScroll(p, y, 16);
      await p.waitForTimeout(1200);
    },
  },
  {
    id: "d10-home-cta",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".cta")!.getBoundingClientRect().top + scrollY - 40);
      await stepScroll(p, y, 16);
    },
  },
  {
    id: "d11-footer",
    viewport: DESK,
    route: { ref: "/", new: "/" },
    act: async (p) => stepScroll(p, await p.evaluate(() => document.documentElement.scrollHeight), 24),
  },
  { id: "m07-menu-open", viewport: MOB, route: { ref: "/", new: "/" }, act: async (p) => { await p.click("#menuBtn"); await p.waitForTimeout(1400); } },
  { id: "d12-about-hero", viewport: DESK, route: { ref: "/#about", new: "/about" } },
  { id: "k12-about-hero", viewport: DESK, theme: "dark", route: { ref: "/#about", new: "/about" } },
  { id: "m08-about", viewport: MOB, route: { ref: "/#about", new: "/about" } },
  {
    id: "d13-about-career-log",
    viewport: DESK,
    route: { ref: "/#about", new: "/about" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".ab-log")!.getBoundingClientRect().top + scrollY + 40);
      await stepScroll(p, y, 16);
    },
  },
  {
    id: "d14-about-tools",
    viewport: DESK,
    route: { ref: "/#about", new: "/about" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".ab-stack")!.getBoundingClientRect().top + scrollY - 20);
      await stepScroll(p, y, 16);
    },
  },
  { id: "d15-projects", viewport: DESK, route: { ref: "/#projects", new: "/projects" } },
  {
    id: "d16-projects-grid",
    viewport: DESK,
    route: { ref: "/#projects", new: "/projects" },
    act: async (p) => {
      const y = await p.evaluate(() => document.querySelector<HTMLElement>(".pgrid")!.getBoundingClientRect().top + scrollY - 100);
      await stepScroll(p, y, 12);
    },
  },
  {
    id: "d17-project-detail",
    viewport: DESK,
    route: { ref: "/#projects", new: "/projects" },
    act: async (p) => {
      await p.locator(".pcard").nth(1).click();
      await p.waitForTimeout(2200);
    },
  },
  {
    id: "d18-project-detail-sections",
    viewport: DESK,
    route: { ref: "/#projects", new: "/projects" },
    act: async (p) => {
      await p.locator(".pcard").nth(1).click();
      await p.waitForTimeout(2200);
      await p.evaluate(() => {
        const s = document.querySelector<HTMLElement>(".po-scroll") ?? document.scrollingElement!;
        s.scrollTo(0, 900);
      });
      await p.waitForTimeout(900);
    },
  },
  { id: "d19-case-studies", viewport: DESK, route: { ref: "/#cases", new: "/case-studies" } },
  {
    id: "d20-case-reader",
    viewport: DESK,
    route: { ref: "/#cases", new: "/case-studies" },
    act: async (p) => {
      await p.locator(".cs-row-btn").first().click();
      await p.waitForTimeout(2600);
    },
  },
  { id: "d21-contact", viewport: DESK, route: { ref: "/#contact", new: "/contact" } },
];

const FIX_CSS = "body{margin:0!important}[hidden]{display:none!important}";

async function shoot(browser: Browser, s: Shot, side: Side) {
  const ctx = await browser.newContext({
    viewport: s.viewport,
    deviceScaleFactor: s.viewport.width < 600 ? 2 : 1,
    colorScheme: s.theme ?? "light",
    hasTouch: s.viewport.width < 600,
    isMobile: s.viewport.width < 600,
  });
  const p = await ctx.newPage();
  const base = side === "ref" ? REF : NEW;
  await p.goto(base + s.route[side], { waitUntil: "networkidle" });
  if (side === "ref") await p.addStyleTag({ content: FIX_CSS });
  // let the loader + intro finish (reference loader ≈1.85s + intro ≈2s)
  await p.waitForTimeout(4800);
  if (s.act) await s.act(p, side);
  await p.mouse.move(-10, -10).catch(() => {});
  await p.screenshot({ path: join(OUT, `${s.id}-${side}.jpg`), quality: 72 });
  await ctx.close();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const s of shots) {
    if (filter && !s.id.includes(filter)) continue;
    for (const side of ["ref", "new"] as Side[]) {
      try {
        await shoot(browser, s, side);
        console.log("✓", s.id, side);
      } catch (e) {
        console.log("✗", s.id, side, (e as Error).message.split("\n")[0]);
      }
    }
  }
  await browser.close();
}

main();
