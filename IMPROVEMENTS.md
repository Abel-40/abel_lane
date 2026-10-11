# IMPROVEMENTS.md — what changed beyond the 1:1 rebuild

The look and identity match the reference (see `PARITY.md`). This file lists what is better
underneath, and what was measured.

## Architecture

- **Real routes** replace hash routing: `/`, `/about`, `/projects`, `/projects/[slug]`, `/case-studies`,
  `/case-studies/[slug]`, `/contact`, plus an on-brand 404 (`GET /path 404`).
- **Project detail.** It opens as an intercepted overlay from any page (`@modal/(.)projects/[slug]`), and is
  a full page on direct visits. Previous/next switch in place through the History API, so URLs and back
  buttons stay correct.
- **Route shutter.** It plays on every internal link (`next/link` `onNavigate`, so prefetching is kept),
  with a shorter sweep on back/forward. A click during the shutter is queued instead of dropped, and focus
  moves to the new page's `h1`.
- **Content.**
  - Generated and typed from `reference/content.json` (`pnpm gen:content`).
  - Case studies are data in `src/content/case-studies.json`, Zod-validated, so a malformed entry fails `pnpm gen:content`.
- **Static output.** Every page and Open Graph image is prerendered. Only `/api/contact` runs on demand.

## Accessibility (WCAG 2.2 AA)

- **axe:** 0 serious or critical violations on every route, in light and dark (`tests/e2e/a11y.spec.ts`).
- **Contrast fixes** (all measured):
  - "Published"/"Current" pill: 4.27 → 4.88.
  - Highlight-reel paragraph: 4.06 → 4.91 (light) and 4.56 (dark).
  - Coloured How-I-build cards: 2.46 → about 4.7 worst case (denser stained glass plus a soft navy scrim
    under the copy).
  - The "Scroll" cue and the tinted card's kind label.
- **Reveals use opacity, not visibility.** Content waiting to animate in stays in the accessibility tree and
  the tab order. (The reference hid it with `visibility: hidden`.)
- **Keyboard and focus:**
  - Skip link; visible focus rings, which switch to light on navy and accent backgrounds.
  - The project dialog traps focus, closes on Esc, and returns focus to the card.
  - The mobile menu makes the page behind it inert. The menu button shows X/"Close menu" while open.
- **Screen readers:**
  - The six journey stages are available to screen readers on desktop (the pinned diagram is decorative).
  - Live regions announce the project count, tool filter, toast and form status.
  - Fields have `aria-invalid` and a described error.
  - Case-study placeholders announce "To do: …".
- **Hit targets:** 44px for the TOC links and the How-I-build project tags (the tags look the same).
- **Reduce Motion:**
  - No loader; instant route swaps; no pins or scrubs.
  - Fully lit timeline; one finished console scenario; static marquee.
  - Stacked work cards on desktop; no cursor, magnetic or tilt effects.
- **Reduce Transparency and forced colours:** no blur, solid surfaces, no orbs.

## SEO

- **Metadata:** per-route title, description, canonical, Open Graph and Twitter.
- **Crawling:** `sitemap.xml`, `robots.txt` (with `/api/` disallowed) and a web manifest.
- **Open Graph images** in the site's style for every page, project and case study (`next/og` with the
  bundled brand fonts).
- **JSON-LD:**
  - `Person`: name, job title, sameAs GitHub/LinkedIn, country, university, AWS credential.
  - `CreativeWork` per project, plus an `ItemList` on `/projects`.
- **Generated favicon and Apple icon** from the AB monogram.

## Features

- **Theme toggle:** system → light → dark. It's persisted and applied before paint, so there's no flash.
  It lives in the footer and the mobile menu, so the nav pill stays identical to the reference.
- **Contact form sends for real:**
  - Sends through Resend with Zod validation, a honeypot and a per-IP rate limit (loopback exempt).
  - Without `RESEND_API_KEY` it falls back to the reference behaviour (compose and copy) and adds an
    "Open in email app" link.
- **Loader:** shown once per session, and skippable with a click, any key or a visible "Skip intro" button.
- **Résumé button:** appears automatically when `public/resume.pdf` exists.
- **View Transitions** (progressive enhancement): the clicked card's art panel morphs into the overlay
  while the GSAP expand runs. Browsers without support, and reduced motion, keep the GSAP-only version.
- **Press feedback:** a 100ms press state on buttons, tabs and filters (`scale`, so it composes with
  magnetic transforms).

## Performance

What was done:

- **Faster first paint.** Above-the-fold entrances are built after first paint (`useIntroGSAP`), while
  the loader or shutter still covers the page.
- **Lazy sections.** Below-the-fold sections set up their animations as they near the viewport
  (`useIdleGSAP`), in page order and one per frame. Everything pending is set up in the background
  shortly after load, so a jump scroll never lands before a pin exists.
- **Fewer refreshes.** ScrollTrigger refreshes are batched (fonts, load, setups) instead of three full
  refreshes at load.
- **Less rendering.** `content-visibility: auto` on long non-pinned sections and the footer.
- **Less script.** Flip only loads on the routes that use it. Path sampling is coarse-to-fine (about 60
  `getPointAtLength` calls instead of 240). `<Suspense>` boundaries let React hydrate Home's sections in
  separate tasks.
- **Paused when hidden.** Offscreen loops pause: hero console, bobbing cards, queue bars, orbs and marquee.
- **No layout shift.** `next/font` for every face; the photo through `next/image` (AVIF/WebP, sized).

Lighthouse 12, production build on localhost (`qa/lighthouse/*.json`):

| Route | Mobile (simulated slow 4G, 4× CPU) | Desktop |
|---|---|---|
| `/` | Performance 72 · A11y 96 · BP 100 · SEO 100 (LCP 4.6s, TBT 340ms, CLS 0) | 94 · 96 · 100 · 100 (LCP 0.9s, TBT 10ms, CLS 0.015) |
| `/about` | 63 · 100 · 100 · 100 | 95 · 100 · 100 · 100 |
| `/projects` | 78 · 100 · 100 · 100 | 96 · 100 · 100 · 100 |
| `/contact` | 75 · 100 · 100 · 100 | — |

Mobile was measured before the last round of changes for `/about`, `/projects` and `/contact`.

Where this leaves the targets:

- **Not met: mobile Performance 95+ and LCP under 2s.**
  - Unthrottled, the LCP paint is the hero lead at first paint (about 0.8s).
  - Lighthouse's simulation attributes the React and GSAP download and hydration to it under slow 4G and a
    4× slower CPU, which gives about 4.6s.
  - Closing the gap needs structural changes. See "Options" in the final report.
- **Met:** CLS under 0.05, TBT well under 200ms on desktop, and Accessibility, Best Practices and SEO.
- **Accessibility 96 on `/`:** the one remaining flag is the statement's words at 13% opacity before they
  are scrolled into view. That is the effect itself; under reduced motion the text is fully opaque.

## Tooling

- `pnpm qa:capture` drives the reference and the build through identical states and writes side-by-side
  pairs to `qa/compare/`.
- Playwright suites: e2e, axe, layout overflow (360–1920px), pins after resize, and cross-browser smoke
  (Firefox, WebKit).
