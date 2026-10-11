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
pnpm build && pnpm start # production build
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm gen:content` | `data/*.json` → `src/content/*.ts` (runs automatically before `build`) |
| `pnpm gen:images [--force]` | Makes 360/480/720w WebP variants of the images in `public/images` |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test:e2e` | Playwright e2e, accessibility and layout checks. Run `pnpm build` first, and `pnpm exec playwright install` once |

## Environment

Copy `.env.example` to `.env.local`, or set these in Vercel:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, OG and JSON-LD (falls back to the Vercel production URL) |
| `RESEND_API_KEY` | Enables real email from the contact form (without it: compose, copy and mailto fallback) |
| `RESEND_FROM` | Sender on a domain verified in Resend |
| `CONTACT_TO` | Recipient (default `addis0132@gmail.com`) |

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel. Next.js and pnpm are detected automatically.
2. Set the environment variables above for Production.
3. Deploy.

Or from the CLI: `pnpm dlx vercel`, then `pnpm dlx vercel --prod`.

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
