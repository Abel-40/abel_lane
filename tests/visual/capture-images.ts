/**
 * Images kit parity: captures the build in the states of kits/images/reference/look/*.jpg and writes
 * qa/compare-images/<id>-{ref,new}.jpg (ref = the kit's screenshot).  Run against `pnpm start -p 3100`.
 *   pnpm exec tsx tests/visual/capture-images.ts [id-filter]
 */
import { chromium, type Page } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.NEW_URL ?? "http://localhost:3100";
const LOOK = join(process.cwd(), "kits/images/reference/look");
const OUT = join(process.cwd(), "qa/compare-images");
const filter = process.argv[2];

const DESK = { width: 1440, height: 900 };
const MOB = { width: 390, height: 844 };

async function toY(p: Page, sel: string, offset: number) {
  await p.evaluate(
    async ([s, o]) => {
      // re-measure every step: pins above the target add spacing as their triggers initialise
      const el = document.querySelector<HTMLElement>(s as string)!;
      for (let i = 0; i < 400; i++) {
        const d = el.getBoundingClientRect().top - (o as number);
        if (Math.abs(d) <= 1) break;
        window.scrollTo(0, window.scrollY + Math.sign(d) * Math.min(500, Math.abs(d)));
        await new Promise((r) => setTimeout(r, 80));
      }
    },
    [sel, offset],
  );
  await p.waitForTimeout(1600);
}

async function openProject(p: Page, index: number) {
  await p.locator(".pcard").nth(index).click();
  await p.waitForTimeout(2200);
}

async function scrollOverlayTo(p: Page, sel: string, offset: number) {
  await p.evaluate(
    ([s, o]) => {
      const box = document.querySelector<HTMLElement>(".po-scroll")!;
      const el = box.querySelector<HTMLElement>(s as string)!;
      box.scrollTo(0, el.getBoundingClientRect().top + box.scrollTop - (o as number));
    },
    [sel, offset],
  );
  await p.waitForTimeout(1000);
}

interface Shot {
  id: string;
  look: string;
  vp: { width: number; height: number };
  dark?: boolean;
  path: string;
  act: (p: Page) => Promise<void>;
}

const homeWork = async (p: Page) => toY(p, ".work-pin", 0);
const grid = async (p: Page) => toY(p, ".pgrid", 90);
const heroSeo = async (p: Page) => openProject(p, 2);
const gallery = (index: number, screen: number) => async (p: Page) => {
  await openProject(p, index);
  await scrollOverlayTo(p, ".gal", 120);
  if (screen) {
    await p.locator(".gal-th").nth(screen).click();
    await p.waitForTimeout(1000);
  }
  await p.mouse.move(390, 248);
  await p.waitForTimeout(700);
};
const casesHover = async (p: Page) => {
  await toY(p, ".cs-rows", 160);
  const row = p.locator(".cs-row-btn").nth(3);
  const b = (await row.boundingBox())!;
  await p.mouse.move(b.x + b.width * 0.45, b.y + b.height / 2, { steps: 8 });
  await p.waitForTimeout(900);
};
const figure = async (p: Page) => {
  await toY(p, ".rd-fig", 120);
  await p.mouse.move(650, 940 - 120, { steps: 4 });
  await p.waitForTimeout(900);
};

const shots: Shot[] = [
  { id: "01", look: "01-home-selected-work-light", vp: DESK, path: "/", act: homeWork },
  { id: "02", look: "02-home-selected-work-dark", vp: DESK, dark: true, path: "/", act: homeWork },
  { id: "03", look: "03-projects-grid-light", vp: DESK, path: "/projects", act: grid },
  { id: "04", look: "04-projects-grid-dark", vp: DESK, dark: true, path: "/projects", act: grid },
  {
    id: "05",
    look: "05-projects-grid-hover",
    vp: DESK,
    path: "/projects",
    act: async (p) => {
      await grid(p);
      const b = (await p.locator(".pcard").nth(0).boundingBox())!;
      await p.mouse.move(b.x + b.width / 2, b.y + 120, { steps: 6 });
      await p.waitForTimeout(1200);
    },
  },
  { id: "06", look: "06-project-hero-light", vp: DESK, path: "/projects", act: heroSeo },
  { id: "07", look: "07-project-hero-dark", vp: DESK, dark: true, path: "/projects", act: (p) => openProject(p, 4) },
  { id: "08", look: "08-project-gallery-light", vp: DESK, path: "/projects", act: gallery(2, 0) },
  { id: "09", look: "09-project-gallery-dark", vp: DESK, dark: true, path: "/projects", act: gallery(4, 2) },
  { id: "10", look: "10-cases-hover-preview-light", vp: DESK, path: "/case-studies", act: casesHover },
  { id: "11", look: "11-cases-hover-preview-dark", vp: DESK, dark: true, path: "/case-studies", act: casesHover },
  { id: "12", look: "12-case-figure-light", vp: DESK, path: "/case-studies/moodverse", act: figure },
  { id: "13", look: "13-case-figure-dark", vp: DESK, dark: true, path: "/case-studies/seo-maker", act: figure },
  { id: "14", look: "14-mobile-home-card", vp: MOB, path: "/", act: (p) => toY(p, "#work-h", 200) },
  { id: "15", look: "15-mobile-projects-grid", vp: MOB, path: "/projects", act: (p) => toY(p, ".pgrid", 70) },
  { id: "16", look: "16-mobile-project-hero", vp: MOB, path: "/projects", act: (p) => openProject(p, 1) },
  {
    id: "17",
    look: "17-mobile-gallery",
    vp: MOB,
    path: "/projects",
    act: async (p) => {
      await openProject(p, 1);
      await scrollOverlayTo(p, ".gal", 130);
      await p.locator(".gal-th").nth(2).click();
      await p.waitForTimeout(1000);
    },
  },
  { id: "18", look: "18-mobile-case-figure", vp: MOB, path: "/case-studies/workroom", act: (p) => toY(p, ".rd-fig", 130) },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const s of shots) {
    if (filter && !s.id.includes(filter)) continue;
    const ctx = await browser.newContext({ viewport: s.vp, colorScheme: s.dark ? "dark" : "light", hasTouch: s.vp.width < 600, isMobile: s.vp.width < 600 });
    await ctx.addInitScript(() => sessionStorage.setItem("abel-loader-seen", "1"));
    const p = await ctx.newPage();
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => r.status() >= 400 && r.url().includes("/images/") && errors.push(`${r.status()} ${r.url()}`));
    try {
      await p.goto(BASE + s.path, { waitUntil: "networkidle" });
      await p.waitForTimeout(1500);
      await s.act(p);
      await p.screenshot({ path: join(OUT, `${s.id}-new.jpg`), quality: 72 });
      copyFileSync(join(LOOK, `${s.look}.jpg`), join(OUT, `${s.id}-ref.jpg`));
      console.log("✓", s.id, s.look, errors.length ? `ERRORS: ${errors.join(" | ")}` : "");
    } catch (e) {
      console.log("✗", s.id, (e as Error).message.split("\n")[0]);
    }
    await ctx.close();
  }
  await browser.close();
}

main();
