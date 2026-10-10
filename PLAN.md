# PLAN.md — Abel Addis portfolio rebuild

Goal: rebuild `reference/index.html` as a Next.js App Router site. First match it 1:1
(`PARITY.md`), then improve it without changing its identity (`IMPROVEMENTS.md`).
`DESIGN.md` is the visual contract.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Repo root | This kit folder (`abel-portfolio-build-kit/`). `reference/` stays untouched and is excluded from TS, ESLint and the build. | PROMPT says "open Claude Code in the folder where you unzipped this kit". |
| Git | `git init` here; one commit per phase (PROMPT §9). Nothing is pushed. | The folder isn't a repo yet. |
| Versions | Next **16.4** (App Router, Turbopack), React **19.2+**, Tailwind **4.3**, GSAP **3.15** + `@gsap/react` 2.1, Lenis **1.3**, Zod 4, Resend 6, Playwright 1.64, pnpm 10. TypeScript is pinned to **5.9.x** (strict). | TS 7 (the native port) is the npm `latest` tag, but Next 16 type-checking still uses the TS 5 JS API. |
| Next 16 docs | Read `node_modules/next/dist/docs/` before each feature: parallel and intercepting routes (a `default.tsx` is required per slot), `Link onNavigate`, metadata and `next/og`, MDX, route handlers. | Next 16 changed conventions (for example `proxy.ts` and slot defaults). |
| Styling | Tailwind v4 **without preflight** (theme + utilities layers only) maps tokens via `@theme inline` (`bg-bg`, `text-ink`, `font-display`…) for layout helpers. Component skins are **plain CSS per area** (`src/styles/{base,chrome,home,about,projects,cases,contact,art}.css`), ported verbatim from the reference with its prefixed class names (`hv-`, `jr-`, `xpw-`, `rule-`, `po-`…); Polish edits are marked `polish:`. `tokens.css` is the single source for light, system dark and forced dark. | The reference relies on browser defaults (content-box, inline SVG), so a reset would shift metrics. Its class prefixes already scope the styles, and keeping them lets the GSAP code use the reference selectors inside each `useGSAP` scope, so ported animation logic stays 1:1. *(Changed in phase 1 from CSS Modules.)* |
| Animation targets | Reference class selectors inside `useGSAP({ scope })` (scoped, so no global leaks), and refs for single elements. | Scoped cleanup; 1:1 with the reference code. |
| Cache Components | `cacheComponents: false`. | With it on, Next 16 hides old routes in `<Activity>` instead of unmounting them. This static site gains nothing from that, and unmounting keeps GSAP and ScrollTrigger cleanup, SVG ids and focus handling predictable, re-initialising each page on every visit as the reference does. |
| Motion branches | `gsap.matchMedia()` with `desktop: (min-width:900px) and (prefers-reduced-motion:no-preference)`, `mobile: (max-width:899.98px) and (no-preference)`, `reduce: (prefers-reduced-motion: reduce)`. | PROMPT §3. |
| Smooth scroll | `ReactLenis root` with `autoRaf:false`. `gsap.ticker` drives `lenis.raf`, `lenis.on('scroll', ScrollTrigger.update)`, `lagSmoothing(0)`. Disabled under reduced motion. | Same wiring as the reference. |
| Content | `scripts/gen-content.ts` reads `reference/content.json` and `icons.json` and writes typed `src/content/*.ts`; it reruns via `pnpm gen:content`. Markup copy (hero, statement, CTA, About, Contact, footer, loader) is copied verbatim into components. | "Port to typed TypeScript data; never retype by hand." |
| Project modal | `app/@modal/(.)projects/[slug]/page.tsx` intercepts every soft navigation to a project (from Home, Projects, the reader or the How-I-build tags), as the reference does. `app/projects/[slug]/page.tsx` is the full page for direct visits and reloads. | Deep links and the overlay animation both work. |
| Page transition | `TransitionProvider` + `TransitionLink` (built on `next/link` `onNavigate` → `preventDefault`, so prefetching still works). The sequence: shutter in → `router.push` → await `pathname` commit plus one frame → `ScrollTrigger.refresh` → shutter out → focus the `h1`. Back and forward use a single fast sweep. | PROMPT §3. |
| Contact | `app/api/contact/route.ts`: Zod, a honeypot, an in-memory IP rate limit (5 per 10 minutes) and Resend. With no `RESEND_API_KEY` it returns `{mode:"compose"}`, and the client falls back to the reference behaviour (compose, copy, plus a `mailto:` link). | PROMPT §7.3. |
| Site URL | `NEXT_PUBLIC_SITE_URL`, falling back to `VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000`. Used for canonicals, the sitemap, OG and JSON-LD. | The production domain is unknown, so it's listed in TODO-ABEL. |
| QA baseline | A Playwright script captures **the reference itself** (served with `npx serve reference`) and **the build** with identical viewports, themes and scroll states, so the pairs in `qa/compare/` are exact like-for-like. The 33 shipped screenshots stay the visual target. | The exact scroll offsets of the shipped shots are unknown; capturing both sides removes the guesswork. |

## File tree (target)

```text
abel-portfolio-build-kit/
├─ PROMPT.md · README.md · DESIGN.md · PLAN.md · PARITY.md · TODO-ABEL.md · IMPROVEMENTS.md
├─ reference/                         # kit (read-only)
├─ scripts/
│  ├─ gen-content.ts                  # content.json + icons.json → src/content/*.ts
│  └─ contrast.ts                     # token-pair contrast report (light/dark/over orbs)
├─ public/                            # resume.pdf (optional), favicons
├─ assets/og/                         # Bricolage/Instrument TTFs for next/og (OFL)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                   # fonts, theme + loader pre-paint script, providers, chrome
│  │  ├─ globals.css                  # @import tailwind, tokens, base, utilities, reduced-* media
│  │  ├─ tokens.css                   # verbatim from reference/tokens.css (+ Polish fixes)
│  │  ├─ page.tsx                     # Home
│  │  ├─ about/page.tsx
│  │  ├─ projects/page.tsx
│  │  ├─ projects/[slug]/page.tsx     # full-page detail (generateStaticParams)
│  │  ├─ @modal/default.tsx           # null
│  │  ├─ @modal/(.)projects/[slug]/page.tsx   # intercepted overlay
│  │  ├─ case-studies/page.tsx
│  │  ├─ case-studies/[slug]/page.tsx
│  │  ├─ contact/page.tsx
│  │  ├─ not-found.tsx                # shutter label "GET /… 404"
│  │  ├─ api/contact/route.ts
│  │  ├─ sitemap.ts · robots.ts · manifest.ts · icon.svg
│  │  └─ **/opengraph-image.tsx       # root, about, projects, projects/[slug], case-studies(/[slug]), contact
│  ├─ content/                        # generated, typed
│  │  ├─ types.ts · projects.ts · cases.ts · experience.ts · history.ts · stack.ts
│  │  ├─ rules.ts · journey.ts · marquee.ts · hero-console.ts · icons.ts · site.ts
│  │  └─ case-studies/*.mdx           # phase 10 (typed frontmatter)
│  ├─ components/
│  │  ├─ chrome/       Nav · MobileMenu · BrandMark · Loader · Shutter · Cursor · ScrollProgress
│  │  │                Toast(+provider) · Footer · ThemeToggle · SkipLink · NavVisibility
│  │  ├─ transition/   TransitionProvider · TransitionLink · useTransitionRouter
│  │  ├─ ui/           Button · IconButton · MiniButton · LinkArrow · Chip · StatusPill · Kicker
│  │  │                SectionMark · Icon · BrandLogo · CopyEmail · Clock · FlowPills · Availability
│  │  ├─ art/          ProjectArt · InsightArt · MoodArt · SeoArt · AlertArt · WorkArt (art.module.css)
│  │  ├─ home/         Hero · HeroGlass · HeroConsole · RotatingWord · Marquee · Statement
│  │  │                Journey · JourneyDiagram · JourneyPanel · JourneyList · WorkRail · WorkCard
│  │  │                Experience · Principles · RuleCard · CaseBand · Cta
│  │  ├─ about/        AboutHero · AboutPhoto · Facts · CareerLog · ToolsBoard · Education · NextLink
│  │  ├─ projects/     ProjectsHero · ProjectFilters · ProjectGrid · ProjectCard
│  │  │                ProjectDetail · ProjectOverlay · ProjectBar
│  │  ├─ cases/        CasesHero · CaseRows · CasePreview · CaseReader · Toc · Placeholder
│  │  └─ contact/      ContactInfo · ContactForm · FormSuccess
│  ├─ hooks/  useRise · useSplitReveal · useMagnetic · useTilt · usePinnedJourney · useWindingTimeline
│  │          useHeroConsole · useScramble · useMarqueeVelocity · useClock · useIntroDelay
│  │          useMotionPrefs · useInView (pause loops) · useCopyEmail
│  ├─ lib/    gsap.ts (plugins, defaults) · motion.ts (curves/durations from DESIGN.md) · lenis.tsx
│  │          site.ts · clipboard.ts · contact-schema.ts · rate-limit.ts · seo.ts (JSON-LD) · routes.ts
│  └─ styles/ shared CSS modules (glass.module.css, buttons.module.css, type.module.css …)
├─ tests/
│  ├─ e2e/   navigation · projects · modal · tools-tabs · reader-toc · contact · copy-email
│  ├─ a11y/  axe.spec.ts (every route × light/dark)
│  ├─ layout/ overflow.spec.ts (360–1920) · console-errors.spec.ts · pins-resize.spec.ts
│  └─ visual/ capture.ts (reference + build → qa/compare/<id>-{ref,new}.jpg)
├─ qa/compare/
├─ playwright.config.ts · next.config.ts · postcss.config.mjs · tsconfig.json · eslint.config.mjs
└─ package.json · pnpm-lock.yaml · .gitignore · .env.example
```

Server components are the default. Client islands are limited to the chrome, transitions, every
animated section, filters, tabs, the form, the modal and the clock.

## Phases (commit after each)

1. **Scaffold, tokens and DESIGN.md.** Scaffold Next 16 with pnpm, strict TS and Tailwind v4, plus
   ESLint and Playwright. Copy in `tokens.css`, the base CSS and fonts (`next/font/google`: Bricolage
   with `opsz`/`wdth` axes, Instrument Sans with `wdth`, JetBrains Mono, Instrument Serif, Great Vibes).
   Write `gen-content.ts` and generate `src/content`. Add the route stubs. Gate: build passes, and the
   tokens render in light and dark.
2. **Global systems.**
   - Wiring: GSAP registration (ScrollTrigger, Flip, SplitText); Lenis + ticker; the theme pre-paint script.
   - Chrome: Nav (pill, sliding link pill, hide and show, force-hide hook), mobile menu, BrandMark draw.
   - Overlays: Loader (once per session, skippable), Shutter + TransitionProvider and Link, cursor,
     magnetic, scroll progress, toast, clock, copy email, skip link and focus management.
   - Gate: navigating every route stub plays the shutter, including back and forward.
3. **Home, section by section in page order.**
   - Order: Hero (glass composition and console), Marquee, Statement, Journey, Work rail, Experience,
     How I build, Case band, CTA, Footer.
   - After each section, screenshot it beside its `d*`, `k*` and `m*` reference.
4. **About.** Hero with the photo reveal and tilt, facts with a count-up, career log terminal and rail,
   tools board (tabs, Flip, spotlight), education, next link.
5. **Projects.** Hero, filters (pill, `aria-pressed`, count, Flip), cards (tilt, batch rise),
   the five art components, the detail page, the intercepted overlay (expand from the card, prev, next,
   breadcrumb, Esc, focus trap, return focus).
6. **Case studies.** Hero step strip, rows with a floating preview, reader (flow strip, sticky TOC with
   scroll-spy, sections, visible `[ placeholders ]`).
7. **Contact and footer.** Info list, open-to chips, glass form (floating labels, validation and shake,
   send morph, success check), the API route, and the footer letters.
8. **Reduced-motion pass.** Every item in PROMPT §5.8 and DESIGN Polish §7, plus reduced transparency.
9. **QA against the reference.** Capture script, side-by-side review and fixes, PARITY ☑, deviations logged.
10. **Improvements.** In order:
    - SEO: metadata, canonicals, sitemap, robots, OG images, JSON-LD.
    - Theme toggle.
    - Resend contact.
    - Résumé button.
    - MDX case studies.
    - Performance work.
    - A11y AA hardening.
    - View Transitions (card → detail).
    - Polish states.
    - Write `IMPROVEMENTS.md`.
11. **Final QA.**
    - e2e, axe (0 serious or critical × every route × both themes), overflow 360–1920, console errors.
    - Pins after resize and font load; Lighthouse mobile; Chromium, Firefox and WebKit runs.
    - Final report.

## Animation hooks → reference behaviour

| Hook | Reference source | Notes |
|---|---|---|
| `useRise` | `rise()` | y 46, power3.out 1s, stagger .08, `top 86%`, once |
| `useSplitReveal` | `split()` + `heroIntro()` | GSAP SplitText `mask:'words'`, `aria:'auto'`, runs after `document.fonts.ready`; chars / words / plain modes |
| `useMagnetic` | `[data-magnetic]` | quickTo ×.3 / ×.35, elastic.out(1,.45) .6s; fine pointers only |
| `useTilt` | photo, pcard, hero stage | quickTo rotationX/Y with power3 |
| `useHeroConsole` | `heroConsole()` | 4 scenarios, typing, trace, response, p95 tween, sparkline, pauses offscreen or when the tab is hidden |
| `usePinnedJourney` | journey block | A=.2, B=.46 segment math, thresholds via `fracOf`, packets, trails, data tags, stage panel typing |
| `useWindingTimeline` | `buildXpPath()` + `xpRender()` | path rebuilt on `refreshInit`/resize, lit state preserved |
| `useMarqueeVelocity` | velocity marquee | boost `1 + min(abs(v) / 380, 6)`, skew ±12, settle on `scrollEnd` |
| `useScramble` | `scramble()` | 1.8s power2.inOut decode, once at `top 82%` |
| `useIntroDelay` | loader `cb(1.85)` / shutter `.42` | intro timelines wait for the loader or shutter |

## Risks & mitigations

1. **Pinned sections across client navigation.** Pin spacers and stale triggers survive route changes.
   - `useGSAP` reverts on unmount.
   - The provider calls `ScrollTrigger.refresh()` after the new route mounts, after `document.fonts.ready`
     and after image loads.
   - `history.scrollRestoration = 'manual'`.
   - Lenis scrolls to top while the page is covered.
   - Tests resize the window mid-page.
2. **Intercepted modal vs shutter.**
   - Project links must not trigger the shutter, and the overlay must survive prev and next.
   - Prev and next use `router.replace`, so close (`router.back()`) still returns to the list.
   - On browser back the overlay closes instantly. React unmounts it before an exit tween could run.
     This deviation is logged.
3. **LCP < 2.0s vs a 1.85s loader and the hero intro** (Lighthouse runs as a first-time visitor).
   - The loader is skippable and shown once per session.
   - The hero copy is server-rendered and visible without JS.
   - The intro only transforms painted text, never `opacity:0` on the LCP block.
   - If Lighthouse still misses 95, I'll present the trade-off (shorten the loader or drop it for
     first paint) rather than silently change the identity.
4. **Scroll smoothness.**
   - Many `backdrop-filter` layers sit over animated blurred orbs, which is expensive.
   - Mitigations: radial-gradient orbs (no `filter: blur`), transform-only animation, offscreen pausing,
     `will-change` only while tweening, and `content-visibility` for below-fold sections without pins.
5. **Contrast on glass.**
   - Measured failures are listed in DESIGN Polish §6.
   - The fixes are small token and opacity tweaks, verified by axe and `scripts/contrast.ts` over the
     lightest orb.
6. **Fonts and CLS.**
   - SplitText runs only after fonts load (`autoSplit` re-splits on font or width change).
   - `next/font` fallbacks use `adjustFontFallback`.
   - The Great Vibes monogram waits for `document.fonts.load` before its stroke draw.
7. **OG images.** `next/og` needs TTF data, so OFL TTFs are bundled in `assets/og/` (no network fetch at
   build time).
8. **Resend sender.** `onboarding@resend.dev` can only deliver to the account owner, so `RESEND_FROM` is
   configurable. Verifying a domain is listed in TODO-ABEL.
9. **Rate limit.** It is in-memory, so it's per serverless instance ("basic", as asked). The upgrade path
   (Upstash) is noted in IMPROVEMENTS.
10. **Browser coverage on Windows.** Chromium, Firefox and WebKit run via Playwright. Real iOS Safari
    (`backdrop-filter`, `svh`) can't be tested here; it's listed in TODO-ABEL as a manual check.
11. **View Transitions + GSAP.** These are scoped to the full-page project route (card art → detail art)
    behind `document.startViewTransition` feature detection. The modal keeps the GSAP clip expand, and
    reduced motion skips both.
12. **Next 16 / TS / pnpm on Windows with a space in the path** (`new por`). This is verified in phase 1
    before any feature work.

## Out of scope (unless asked)

Pushing to a remote, creating a Vercel project, or writing case-study content. Placeholders stay
placeholders, and résumé content, real metrics and the domain come from Abel (`TODO-ABEL.md`).
