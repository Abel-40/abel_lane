# Abel Addis — portfolio

Next.js 16 (App Router) with GSAP (ScrollTrigger, SplitText, Flip), Lenis, Tailwind 4 and TypeScript. Every page is
static; only `/api/contact` runs as a function.

## Where the content lives

All text and data you edit is in **`data/`**. Images are in `public/images/` and `src/assets/`.

| What | File |
|---|---|
| Your name, role, email, GitHub, LinkedIn, **résumé link**, footer bio, SEO description | `data/site.json` |
| About page: hero heading and intro, facts row, education and certification, experience timeline (also on the home page), career log, tools board | `data/about.json` |
| Projects: text, features, flow, stack, live and repo links, screenshots | `data/projects.json` |
| Case studies: title, question, sections, decisions, code, figure | `data/case-studies.json` |
| Home page: hero console, principles, request journey, marquee | `data/home.json` |
| Icon library (UI, generic and brand marks) | `data/icons.json` |
| About photo | `src/assets/abel.png` |
| Project screenshots | `public/images/projects/` |
| Case-study figures | `public/images/cases/` |
| Résumé file (if you host it here) | `public/resume.pdf` |

After editing a JSON file, run `pnpm gen:content` (or just `pnpm build`, which runs it first). It turns `data/` into
typed modules in `src/content/` and fails with a clear message if something is malformed. Don't edit the generated
`src/content/*.ts` files; edit the JSON.

**Résumé.** In `data/site.json`, `resume` can be:

- `"/resume.pdf"`: a file in `public/`. The button shows only when the file exists, and downloads it.
- a full `https://` link (Google Drive, Dropbox…): opens in a new tab.
- `""`: hides the button.

**Project links.** In `data/projects.json`, set `links.live` and `links.repo` to an `https://` URL, or `null` to hide.

**New screenshot.** Put the 1800px WebP and its `-sm` (960px) file in `public/images/projects/`, reference them in
`data/projects.json`, then run `pnpm gen:images` to make the smaller sizes.

## Run locally

Requirements: Node 20+ and pnpm 10.

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm build && pnpm preview # the real Cloudflare Worker, locally on http://localhost:8787
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Content → `next build` → Cloudflare Worker in `.open-next/` (OpenNext), with the prerendered pages copied into its static assets |
| `pnpm preview` | Runs the built Worker locally (`wrangler dev`) |
| `pnpm run deploy` | `wrangler deploy` from your machine (needs `npx wrangler login` once). Plain `pnpm deploy` is a different, built-in pnpm command |
| `pnpm build:next` / `start` | Plain `next build` / `next start` (what the e2e tests use by default) |
| `pnpm gen:content` | `data/*.json` → `src/content/*.ts` (runs automatically before `build`) |
| `pnpm gen:images [--force]` | Makes 360/480/720w WebP variants of the images in `public/images` |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test:e2e` | Playwright e2e, accessibility and layout checks. Run `pnpm build` first, and `pnpm exec playwright install` once |

## Environment

All optional. Locally, copy `.env.example` to `.env.local`. On Cloudflare, add them in the Worker's
**Settings → Variables and Secrets** (use the *Secret* type for `RESEND_API_KEY`).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Override the site origin (defaults to `url` in `data/site.json`, `https://abel-addis.com`) |
| `RESEND_API_KEY` | Enables real email from the contact form (without it: compose, copy and mailto fallback) |
| `RESEND_FROM` | Sender on a domain verified in Resend |
| `CONTACT_TO` | Recipient (default `addis0132@gmail.com`) |

## Deploy to Cloudflare (Workers, free plan)

The site runs as a Cloudflare Worker named `abel-lane` (`wrangler.jsonc`), served on `abel-addis.com` and
`www.abel-addis.com`. Every page is prerendered and read from the Worker's static assets, so there is no R2, KV or
database to set up.

In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository** → `Abel-40/abel_lane`, then:

| Setting | Value |
|---|---|
| Project name | `abel-lane` (must match `name` in `wrangler.jsonc`) |
| Build command | `pnpm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |

Every push to `main` then builds and deploys. `wrangler deploy` attaches `abel-addis.com` and `www.abel-addis.com`
(the domain is in the same Cloudflare account). If either hostname already has a DNS record (for example a parking
page), delete that record first or the domain can't be attached.

Notes:

- `pnpm-workspace.yaml` uses `nodeLinker: hoisted` because the OpenNext bundler can't read pnpm's symlinks on Windows.
- `patches/` holds a one-line fix for `@opennextjs/cloudflare` 1.20.8: Next 16.4 added `server/preview-props.json`,
  which the adapter didn't inline, so every request failed. Drop the patch when the adapter handles it.
- The About photo is resized by Cloudflare Images through the `IMAGES` binding (free allowance: 5,000 unique
  transformations a month, far more than this site needs).

## Code layout

```text
data/             all editable content (see above)
public/images/    project screenshots and case-study figures
src/app/          routes, @modal (project overlay), api/contact, OG images, sitemap, robots
src/components/   chrome (nav, loader, cursor, footer), home/, about/, projects/, cases/, contact/, ui/
src/content/      generated typed modules + types and the case-study schema
src/hooks/        GSAP setup hooks
src/lib/          gsap, animation helpers, scroll, overlay, seo, og
src/styles/       design tokens and per-area CSS
assets/og/        fonts used to draw the Open Graph images
scripts/          content and image generators
tests/e2e/        Playwright tests
```
