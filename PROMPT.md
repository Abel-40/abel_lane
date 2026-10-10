# Build prompt — Abel Addis portfolio

> **How to use:** open Claude Code in the folder where you unzipped this kit and say:
> **"Read PROMPT.md and follow it exactly."**
> (Or paste everything below the line.)

---

You are rebuilding my developer portfolio as a production web app. A complete, working reference version already exists in `reference/index.html`. It is a single-file HTML/CSS/JS site using GSAP 3.13 (with the ScrollTrigger and Flip plugins) and Lenis smooth scroll.

**Your goal has two levels:**

1. **Minimum bar: an exact match.** Reproduce the reference 1:1. That covers:
   - the same content, layout, colours and typography;
   - the glass materials, light and dark themes, and responsive behaviour;
   - every animation and interaction listed in section 5.
2. **Then make it better.** Make it more polished, faster, more accessible, better structured and better for SEO, without changing its identity. If an "improvement" would make it look like a different site, don't make it.

---

## 0. Before writing any code: load the design skills

1. **Invoke the `/awesome-design-md` skill.** Use it to write a `DESIGN.md` at the repo root for *this* site, in the DESIGN.md format that skill describes. Capture the brand exactly as it exists in the reference:
   - colour tokens for light and dark (from `reference/tokens.css`);
   - type families and scale, spacing, radii and elevation;
   - glass/frosted materials, iconography and motion principles;
   - component specs: buttons, chips, the nav pill, section markers, glass cards, the hero console, the timeline, the journey diagram, forms and so on.

   **Do not replace the palette with another brand's.** The reference brand is the source of truth. From then on, DESIGN.md is the contract every component follows.
2. **Invoke the `/apple-design` skill.** Apply its principles as the polish layer:
   - typographic hierarchy, optical sizing and a consistent spacing rhythm;
   - restrained, purposeful motion with natural easing and springs that can be interrupted and never block input;
   - disciplined use of materials and vibrancy on the glass surfaces;
   - clarity and deference to content;
   - hit targets of at least 44×44 px, real contrast, and support for Reduce Motion and Reduce Transparency.

   Record the rules you applied in a **"Polish"** section of DESIGN.md.
3. If either skill is not installed, say so in one line and continue with the guidance in this prompt. Don't stop.
4. **Plan before building.** Use plan mode, study the reference (section 1), then write:
   - `PLAN.md`: phases, file tree, component list and risks;
   - `PARITY.md`: a checklist with one line for every item in section 5, ticked ☐ → ☑ as you go.

   Show me the plan before you start building.

---

## 1. Study the reference first

| File | What it is |
|---|---|
| `reference/index.html` | **Source of truth.** Every timing, easing, colour and layout value is in its CSS/JS. Serve it with `npx serve reference` and open it with Playwright. It loads GSAP, Lenis and Google Fonts from CDNs, so it needs internet. |
| `reference/screenshots/` | 33 captures:<br>• `d*` — desktop light, 1440×900<br>• `k*` — desktop dark<br>• `m*` — mobile, 390×844<br>Your build must match these. |
| `reference/content.json` | All structured content:<br>• projects, case studies, experience, career history<br>• tool stack, principles ("rules")<br>• request-journey stages and diagram nodes, marquee words<br>• hero-console scenarios<br>**Port this to typed TypeScript data; never retype it by hand.** |
| `reference/tokens.css` | Colour and material tokens: light (`:root`), system dark, and forced dark (`[data-theme="dark"]`). |
| `reference/icons.json` | • `ui`: 24×24 stroke icons<br>• `generic`: tool icons for tools without a logo<br>• `brands`: tech logos (Simple Icons CC0, Devicon MIT) with brand colours |
| `reference/abel.webp` | My photo. Used **once**, on the About page only. |

Copy in markup only (hero, statement, CTA, About, Contact, footer, loader) lives in `index.html`. Take it verbatim.

---

## 2. Tech stack

- **Next.js** (latest stable, App Router), **TypeScript** (strict) and **pnpm**.
- **Styling:** Tailwind CSS v4 with the design tokens as CSS custom properties, so the light/dark token sets switch from one place. Use plain CSS (modules) wherever Tailwind gets awkward, such as complex glass, masks and keyframes.
- **Animation:** `gsap` with `@gsap/react` (`useGSAP`), and the ScrollTrigger, Flip and SplitText plugins. All GSAP plugins are free. Smooth scroll uses **Lenis** (`lenis/react`), driven by `gsap.ticker` with ScrollTrigger updated on Lenis scroll.
- **Fonts and images:** `next/font/google` for every font (no layout shift), and `next/image` for the photo.
- **Content:** typed data in `src/content/*.ts`, generated from `content.json`. Case-study bodies may move to MDX (see section 7).
- **Testing and deployment:** Playwright for end-to-end and visual checks, `@axe-core/playwright` for accessibility, and Vercel-ready **static generation** (a server route only for the contact form).

---

## 3. Routes and architecture

The reference is a hash-routed single page. Make it real routes:

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/projects` | Project list with filters |
| `/projects/[slug]` | Project detail. A full page on direct visits, and an **intercepted modal** (parallel + intercepting routes) when opened from Home or Projects, so the overlay animation and deep links both work. |
| `/case-studies` | Case-study list |
| `/case-studies/[slug]` | Case-study reader |
| `/contact` | Contact |
| `not-found` | On-brand 404 (shutter label `GET /… 404`) |

**Slugs:** `insight-stream`, `moodverse`, `seo-maker`, `alertchain`, `workroom`.

**Architecture rules**
- **Page transition.** A `TransitionProvider` plus `TransitionLink` intercepts internal navigation, plays the shutter-in animation, calls `router.push`, waits for the new route to mount, then plays the shutter-out. On back/forward, use a shorter version. Move focus to the new page's `h1` after every navigation.
- **Animation hygiene.** Animations live in client components using `useGSAP({ scope })`. Every ScrollTrigger is cleaned up on unmount. Use `gsap.matchMedia()` with three branches: desktop (≥900px), mobile, and `prefers-reduced-motion`.
- **Refresh timing.** Call `ScrollTrigger.refresh()` after fonts are ready (`document.fonts.ready`) and after images load.
- **Hydration.** Clock values and anything time- or random-based render on the client only.
- **Server components.** Keep server components as the default and add client islands only where there is interaction or motion.

---

## 4. Design system summary (DESIGN.md holds the full version)

### Colour (light)

| Token | Value |
|---|---|
| bg | `#EDF3FC` |
| bg-2 | `#E3ECF9` |
| ink | `#0A1838` |
| body | `#33456A` |
| muted | `#56688C` |
| accent | `#1E66F5` |
| accent-2 (cyan) | `#13A0E0` |
| deep navy | `#0A1838` / `#14306E` |
| ok | `#0E9F57` |
| warn | `#D2691C` |

Dark values are in `tokens.css`; dark bg is `#060D1F`, accent `#2F6EF0`, accent-2 `#36C0F2`. The theme follows the system, and `[data-theme]` forces one.

### Glass recipe
Used by the "How I build" cards, the hero composition and the journey band:
- `linear-gradient(140deg, var(--rg-a), var(--rg-b))`;
- plus a radial tint of the card's hue in the top-right corner;
- `backdrop-filter: blur(22–24px) saturate(1.6)`;
- a 1px `--rg-edge` border and an inset top highlight (`--rg-hi`);
- soft drifting blurred colour orbs behind (`--orb-o` opacity).

### Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (variable: opsz 12–96, wdth 75–100, wght 200–800) | Headings use `font-stretch` 75–88% with tight negative tracking (−.035 to −.045em) and line-height around .92 |
| Body | **Instrument Sans** | Variable wdth and wght |
| Labels, code, meta | **JetBrains Mono** | |
| Logo wordmark accent ("Addis") | **Instrument Serif** italic | |
| Logo monogram ("AB") | **Great Vibes** | Script |

### Layout
- 1280px max `.wrap` with a fluid gutter `clamp(16px, 4vw, 40px)`.
- Full-bleed motion bands: the journey, the horizontal work rail, and the navy case band.
- Large radii (14–34px).

### Section markers
A numbered pill (`01`…`07`), a label, and a line that draws in with a dot at its end:
- 01 What I care about
- 02 How it works
- 03 Projects
- 04 Experience
- 05 Principles
- 06 Deep dive
- 07 Contact

---

## 5. Parity spec — every section and interaction

Each item below goes into `PARITY.md`. Timings in brackets are the reference values; keep them unless the `/apple-design` polish gives a clearly better curve.

### 5.1 Global

1. **Loader** (first load). A navy screen with a terminal log that types in line by line:
   - `$ abel serve --env production`
   - `✓ FastAPI services up`
   - `✓ Celery workers ready`
   - `✓ pgvector index loaded`
   - `✓ Listening`

   A `000→100` counter and a progress bar run alongside (1.3s, power2.inOut). Then the content lifts away and the screen splits into top and bottom panels that slide apart (expo.inOut .85s). Clicking speeds it up ×4.
   *Improvement:* show it once per session and let users skip it.
2. **Shutter page transition.**
   - Four vertical bars sweep up (power4.inOut .62s, stagger .055).
   - A centred label reads `GET /about` and then `200 OK` pops in.
   - The new page swaps in underneath, then the bars exit upward.
   - Labels per route: `/`, `/about`, `/projects`, `/case-studies`, `/contact`.
3. **Nav** — a floating frosted pill bar.
   - **Brand mark:** the "AB" monogram in Great Vibes, white on a blue→cyan gradient rounded square. After the loader, the letters draw in as strokes and then fill (written-by-hand feel). On hover the square tilts −8° and a sheen sweeps across it. Wordmark: "Abel *Addis*".
   - **Links:** centred in a tray, with a white pill that slides under the active link.
   - **Right side:** an "Open to remote work" chip with a pulsing green dot, and a magnetic "Let's talk" accent button.
   - **Hide/show:** hides on scroll-down past 260px and shows on scroll-up. It is force-hidden while the journey section is pinned.
   - **Mobile:** a hamburger opens a full-screen navy menu with huge links, route hints (`/about`…), the availability chip and my email.
4. **Scroll progress bar** at the very top (scaleX).
5. **Custom cursor** (fine pointers only). A ring follows the pointer (quickTo .35s). It grows over links and buttons and shows a label (e.g. "Open") on elements with `data-cursor`. Hidden on touch and when the mouse leaves the window.
6. **Magnetic buttons.** Elements with `data-magnetic` follow the pointer (×.3 horizontally, ×.35 vertically) and spring back (elastic.out(1,.45)).
7. **Shared utilities:**
   - Copy email shows a toast ("Email copied").
   - A live Addis Ababa clock (`Africa/Addis_Ababa`) appears in several places.
   - A `rise` reveal (y 46 → 0 with fade, power3.out 1s, stagger .08, starting at "top 86%").
   - SplitText character and word reveals for headings.
   - A scramble/decode text effect.
8. **Themes:** light and dark from the system. Glass surfaces have dark-mode token sets. (A toggle is an improvement; see section 7.)

### 5.2 Home

1. **Hero.** Two columns on desktop, stacked on mobile.
   - **Left column:**
     - a kicker pill with a pulse dot: "Backend engineer, AI systems · Ethiopia (UTC+3)";
     - an H1 in three lines: "I build the / **[rotating word]** / behind AI products.";
     - the H1 characters rise in. The rotating word cycles systems → APIs → workers → pipelines → retrieval: the old word slides up and out, the new one slides up and in, the width animates, and a cyan caret blinks;
     - the lead paragraph;
     - "See the work" (scrolls to the work section) and "Get in touch" buttons;
     - credentials row underneath: Andela · AWS Certified · BSc Software Engineering · 2+ years.
   - **Right column: a frosted-glass composition.** Blurred blue, cyan and indigo orbs drift behind it.
     - **Console card.** Bar text: "sample request". Shows the current project name, `POST /v1/...`, and a status pill (`··· pending` → `200 OK · 412 ms`). It replays the four scenarios in `content.json → heroConsole`. For each one it:
       - types the request JSON;
       - grows three waterfall trace bars (labels and ms per scenario);
       - prints the response JSON line by line with syntax colours (keys accent, strings green, numbers and booleans amber);
       - flips the status pill;
       - waits about 2.8s, then moves to the next scenario.
     - **p95 latency card.** The number tweens to each scenario's value and an SVG sparkline with a gradient fill shifts.
     - **Celery workers card.** Three job progress bars loop; a "N done" counter goes up on every loop.
     - **Local-time pill.** Clock, "Addis Ababa · open to remote".
     - **Logo chips.** FastAPI, PostgreSQL, Redis, Celery, Gemini, in brand colours on glass.
     - **Intro.** The console rises in, the metric and queue cards fly in rotated with back easing, and the chips pop in staggered.
     - **Motion.** Pointer parallax by depth (each card has a depth value) plus a gentle 3D tilt of the whole stage. The cards bob slowly. On scroll the cards drift apart (metric up, queue down).
     - **Mobile.** Only the console, the metric card and the time pill.
     - **Honesty.** The console numbers are illustrative; keep the "sample request" label.
   - A "Scroll" cue sits bottom-right.
2. **Marquee.** Two rows of tech names, the second row outlined.
   - The rows run in opposite directions forever.
   - Scroll velocity speeds them up (up to ×7), flips direction with scroll direction, and skews the text (±12°).
3. **Statement (01).** Large text "I care less about adding AI for its own sake, …".
   - Each word goes from opacity .13 to 1 as you scroll (scrub).
   - Signature line underneath.
4. **Request journey (02), "How a request moves through the systems I build."**
   - **Desktop: pinned for 2.8 viewport heights** (scrub .6) inside a full-screen rounded band. The band is the **frosted cyan glass** recipe:
     - glass gradient;
     - radial tint `#0E8FD0` 24% top-right and `#5ED0FF` 14% bottom-left;
     - blurred cyan and indigo orbs behind;
     - the band scales .93 → 1 and its radius goes 60 → 34 as it enters.
   - **Left panel:**
     - `POST /v1/ask` plus a state chip (receiving, validating, …);
     - a big `NN / 06` counter, title, description and tech chip;
     - a dark "Example payload" code block that types in;
     - a progress meter.

     The text transitions out and in as each stage changes.
   - **Right stage:**
     - step chips 1–6 (done, current, future);
     - an SVG diagram in a 640×400 viewBox, with node positions in `content.json → jnodes` and paths in `index.html`:
       - **Flow:** User → API endpoint (with a dashed async link to the Job queue) → splits into two lanes (PostgreSQL and Vector DB) → merges → Knowledge → AI model → Response.
       - **On scroll:**
         - paths draw in;
         - a glowing packet with a trail and halo travels the path, and a second packet rides lane B;
         - junction points light up;
         - nodes light up, and the current node glows and shows a ring burst.
       - **Data tag.** A small ink-coloured pill (icon + label) rides just above the glowing packet and shows what the request is carrying:
         - `JSON` → `query` → `SQL` / `embed` (one per lane) → `rows` / `top-k` → `results` → `context` → `tokens` → `200 OK`;
         - it shrinks and hides while passing through a node, and comes out with the new label (with a pop);
         - the lane-B tag fades out before the lanes merge.
   - **Mobile:** a vertical numbered list of the six stages instead of the pinned diagram.
5. **Selected work (03).** Header "Selected work"; subtitle "Four products, …"; counter `01 / 04` with a progress bar.
   - **Desktop:** pinned horizontal rail of the **first 4 projects** plus an end card ("That's the highlight reel." with an "All projects" button).
     - The counter follows the card nearest the centre.
     - Cards scale .9 → 1 and rotate 2° → 0° as they enter.
     - The art inside each card parallaxes ±4%.
     - Card 2 is deep navy and card 4 is tinted.
     - "Open project" opens the project detail, expanding from the card.
   - **Mobile:** a vertical stack.
6. **Experience (04), "Where I've shipped."** A winding SVG timeline down the centre.
   - Cards alternate left and right, overlap in a zig-zag, and are at most 430px wide.
   - A big outlined year sits on the opposite side ("Now", "2025–26", "2025", "2023") and fills with the accent gradient when its card is reached.
   - Scroll draws the line. A white head dot with a pulsing halo travels down it; each dot lights up, its connector draws, and a ring bursts.
   - **Each card appears only when the head reaches its dot**, sliding in from the spine with its contents staggered, and hides again when you scroll back up.
   - **Mobile:** the spine runs down the left with a small wiggle.
7. **How I build (05).** Six **sticky stacked glass cards** (the top offset grows by 18px per card).
   - **Card fills alternate.**
     - Light tinted glass: cards 1, 3, 5.
     - Coloured glass: cards 2, 4, 6 (hue at 88% → 66%, white text).
     - Per-card hues are in the reference.
   - **Layout of each card:**
     - top row: an index pill `01 / 06`, a gradient line, and an icon tile;
     - bottom left: title and description;
     - bottom right: a "Where it shows up" proof panel, with **project tag buttons** that open that project (the Andela tag goes to /about);
     - a huge outlined watermark number that parallaxes.
   - **Stacking.** When the next card arrives, the previous one scales to .92 and fades toward the page background.
   - Coloured orbs drift behind the stack so the glass visibly shifts colour as you scroll.
8. **Deep dive (06).** A navy band.
   - Label "Case study 01, MoodVerse".
   - The question "How do you recommend scripture by mood without ever letting an LLM invent a verse?" decodes in with the scramble effect.
   - The answer, then "Read the case study" (opens the reader) and "All case studies".
   - On the right, a "More write-ups" list with statuses and hover arrows.
9. **CTA (07).** "Hiring for a backend or AI role?" (words rise in), the lead, a large round magnetic "Let's talk" ball, and a meta row ("It's 22:31 in Addis Ababa" plus the email and a copy button).

### 5.3 About

1. **Hero.**
   - **Text:** a split-character H1 "From UI/UX to the systems behind products.", two lead paragraphs, and "Résumé" and "Get in touch" buttons.
   - **Photo** (the only place my photo appears):
     - a clip-path reveal (`inset(100% 0 0 0 round 32px)` → `inset(0)`, expo.inOut 1.3s), with the image scaling 1.25 → 1 inside;
     - the name tag slides in and the "Freelancing, open to remote" chip pops in;
     - pointer 3D tilt (rotateY ±6°, rotateX ±5°) and a slight scroll parallax.
2. **Facts row.** "2+" years counts up from 0, then Andela, AWS and UTC+3.
3. **Career log.** A terminal card (`~/abel`) types `$ git log --career`.
   - Each history entry is a "commit" (period, label, org) that expands to show its bullets.
   - The head entry is marked.
   - A vertical rail fills on scroll with a travelling head dot, and commits light up as they are passed.
4. **"Tools I ship with."**
   - A count ("N tools across 6 areas").
   - Tabs: **All** plus 6 categories, with a sliding pill.
   - A board of compact tool cards: a 36px brand-coloured logo tile, the name and the group label.
   - Tab changes animate with Flip.
   - A cursor spotlight on the board (`--mx`/`--my` radial).
   - Cards pop in with back easing.
5. **Education.** Two cards: BSc Software Engineering (Arba Minch University, June 2026) and AWS Certified Cloud Practitioner.
6. **Next link.** "See the projects →", large.

### 5.4 Projects

1. **Hero:** "Five products, each built around a real problem."
2. **Filters:** All · AI and retrieval · Async and data · Full-stack · Mobile.
   - A sliding pill and `aria-pressed`.
   - "Showing N of 5".
   - The grid re-flows with Flip.
3. **Project cards:**
   - contents: art illustration, number, status pill, name, tagline, hook, chips, "View project →" and kind label;
   - 3D tilt and a lift on hover;
   - batch rise-in on scroll.
4. **Project detail** (modal from the list or Home; a full page on direct visits). It opens by expanding from the clicked card, then its sections rise in.
   - **Top bar:**
     - breadcrumb "‹ projects / moodverse" (**"projects" is clickable** and goes back to the list);
     - previous, next and close buttons (Esc closes; focus is trapped while open).
   - **Hero:** status pill, role chip and tags; giant name; tagline; art panel.
   - **Sections:** The problem (big quote) · The product · Key capabilities (two-column checklist) · How it flows (step chips with arrows) · Tech stack (grouped chips) · actions (Read the case study / GitHub) · Next project.
5. **Project art.** Each project (`art`: insight, mood, seo, alert, work) has an illustration built from simple shapes (cards, bars, chat bubbles, chart, bookmark, check, arrows) using the `--art-*` tokens. Rebuild each one as a React component that matches the screenshots in both themes.

### 5.5 Case studies

1. **Hero:** "The decisions behind the code."
   - A five-part step strip (Context, Design, Implementation, Validation, Reflection).
   - A connecting line draws across it, and the steps rise in staggered.
2. **Rows:** number, title, summary, project, status pill (Published / In writing / Planned) and arrow. **Hovering a row shows a floating, slightly rotated art preview that follows the cursor.**
3. **Reader** (`/case-studies/[slug]`):
   - back link, tags, title and lede;
   - a "System flow" strip;
   - a sticky table of contents with scroll-spy, and the body sections.
   - Sections I haven't written yet show bracketed placeholders such as `[ Your validation rules and why ]`. **Keep them visibly marked as TODO for me. Never fill them with invented content.**

### 5.6 Contact

1. **Left column.**
   - Kicker, then the H1 "Let's build something reliable.", then the lead.
   - A list:
     - Email, with a copy button;
     - GitHub `github.com/Abel-40`;
     - LinkedIn `linkedin.com/in/abel-addis`;
     - Local time (UTC+3).
   - "Open to" chips.
2. **Right column: a glass form card.**
   - **Fields:** floating labels for name, email, topic (select) and message.
   - **Validation:** an inline message and a small elastic shake.
   - **Submit:** the button shrinks into a circular spinner, then a success panel with an animated check draws in.
   - **Current behaviour vs. the build:** the reference only composes the message and copies it. The production build sends it for real (section 7).

### 5.7 Footer

- A short bio line; icon buttons (copy email, GitHub, LinkedIn); "Back to top".
- A giant "Abel Addis" whose letters rise one by one as the footer scrolls in (scrub).
- A bottom row: "© 2026 Abel Addis · Backend Engineer, AI Systems".

### 5.8 Reduced motion and fallbacks

Every animated element has a static, complete state when `prefers-reduced-motion: reduce` is set:

- no loader;
- shutter replaced with an instant swap;
- no pins or scrub;
- timeline fully lit and all experience cards visible;
- console shows one finished scenario;
- no cursor or magnetic effects;
- marquee static or very slow.

---

## 6. Content rules (do not break these)

- Use **only** the facts in `content.json` and `index.html`. **Never invent** employers, metrics, numbers, links, testimonials, clients or dates.
- The hero console is labelled **"sample request"** and its numbers are illustrative. Keep that label; don't present them as real production metrics.
- **Contact details:**
  - email `addis0132@gmail.com`;
  - GitHub `https://github.com/Abel-40`;
  - LinkedIn `https://www.linkedin.com/in/abel-addis`.
- The photo appears **once**, on About.
- Placeholders that need me (case-study sections, the résumé PDF) stay clearly marked. Collect them in a `TODO-ABEL.md` file.

---

## 7. Improvements to make after parity is ☑

1. **SEO.**
   - Per-route `metadata`, canonical URLs, `sitemap.xml` and `robots.txt`.
   - **Open Graph images** generated with `next/og` per page and per project.
   - JSON-LD: `Person` (name, jobTitle, sameAs, address country Ethiopia) and `CreativeWork` per project.
2. **Theme toggle:** system / light / dark, persisted, with no flash on load (inline script before paint).
3. **Contact form sends for real.**
   - A route handler or Server Action using **Resend** (`RESEND_API_KEY`), with Zod validation, a honeypot field and basic rate limiting.
   - If the key is missing, fall back to the reference behaviour (compose and copy, plus a mailto link).
4. **Résumé button.** Serves `/public/resume.pdf` if present; otherwise hide it, and list it in `TODO-ABEL.md`.
5. **Case studies in MDX** with typed frontmatter (status, project, sections), so I can write the remaining ones easily.
6. **Performance.**
   - Lighthouse on mobile: **95+** in all four categories.
   - Core Web Vitals: LCP under 2.0s, CLS under 0.05, INP under 200ms.
   - Lazy-initialise heavy scroll sections; pause offscreen loops (hero console, orbs, marquee); serve the photo as AVIF/WebP at the right sizes.
   - Use `will-change` only while an element is animating.
7. **Accessibility: WCAG 2.2 AA.**
   - A skip link and visible focus rings; everything works from the keyboard.
   - Correct landmarks; `aria-live` for the counter, toast and form status.
   - Real dialog semantics for the project modal.
   - Contrast verified on top of the glass.
   - `prefers-reduced-transparency` swaps the glass for solid surfaces.
8. **View Transitions API** as a progressive enhancement for shared elements (project card → detail), alongside the GSAP shutter.
9. **Polish from `/apple-design`.** Refine easing curves and durations, spacing rhythm, optical alignment and hover/press states. Make every interactive element feel responsive within 100ms.
10. Anything else that makes it clearly better **without changing its look and identity.** List what you changed in `IMPROVEMENTS.md`.

---

## 8. Quality gates (verify before you call it done)

- **Visual parity.** Write a Playwright script that captures the same states as `reference/screenshots/` (same viewports and scroll positions, light and dark) and save them next to the reference shots in `qa/compare/`. Review them side by side and fix the differences. Note any deliberate deviations in `PARITY.md`.
- **End-to-end tests:**
  - navigation and transitions, including back/forward and deep links;
  - project filter and count;
  - project modal (open, previous/next, breadcrumb, Esc, deep link);
  - tools tabs;
  - case-study reader table of contents;
  - contact validation and success;
  - copy email.
- **Accessibility:** axe reports **0 serious or critical** issues on every route, in both themes.
- **Stability and layout:**
  - **no console errors**;
  - **no horizontal overflow** from 360px to 1920px wide;
  - the pinned sections behave correctly after a resize and after fonts load.
- **Smoothness:** steady 60fps scrolling on a mid-range laptop (check with the Performance panel); no long tasks over 100ms during scroll.
- **Browsers:** latest Chrome, Safari and Firefox, plus iOS Safari (check the `backdrop-filter` and `svh` behaviour).
- Lighthouse scores from section 7.6.

---

## 9. How to work

- **Build in phases and commit after each one:**
  1. Scaffold, tokens and DESIGN.md.
  2. Global systems: fonts, theme, Lenis/GSAP setup, nav, loader, shutter, cursor.
  3. Home, section by section, in page order.
  4. About.
  5. Projects and the detail page/modal.
  6. Case studies.
  7. Contact and the footer.
  8. Reduced-motion pass.
  9. QA against the reference.
  10. Improvements.
  11. Final QA.
- After each section, screenshot it next to the matching reference screenshot before moving on.
- Keep components small and typed. Put animation logic in hooks (e.g. `useRise`, `useSplitReveal`, `useMagnetic`, `usePinnedJourney`, `useWindingTimeline`, `useHeroConsole`).
- When exact parity conflicts with an `/apple-design` principle, **identity and layout win**. Apply the principle to details only (easing, spacing, contrast, states) and note it in PARITY.md.
- **Finish with a short report:**
  - what matches the reference;
  - what you improved;
  - anything I still need to provide (from `TODO-ABEL.md`);
  - how to run it locally and deploy it to Vercel.
