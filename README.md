# Abel Addis — portfolio

Next.js 16 (App Router) rebuild of the reference portfolio in `reference/`. It uses GSAP (ScrollTrigger,
SplitText, Flip), Lenis, Tailwind 4 and TypeScript, and generates static pages.

- `DESIGN.md`: the design contract.
- `PARITY.md`: the reference-to-build checklist.
- `IMPROVEMENTS.md`: what changed beyond 1:1.
- `TODO-ABEL.md`: what only you can provide.

## Run locally

Requirements: Node 20+ and pnpm 10.

```bash
pnpm install
pnpm dev                 # http://localhost:3000
```

Production build:

```bash
pnpm build               # runs `gen:content` first (prebuild)
pnpm start               # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm gen:content` | Regenerates `src/content/*.ts` from `reference/content.json`, `reference/icons.json` and the case-study MDX frontmatter |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test:e2e` | Playwright: e2e, axe (both themes), overflow, pins, Firefox/WebKit smoke. Run `pnpm build` first, then `pnpm exec playwright install` once |
| `pnpm qa:capture [id]` | Visual parity: serve the reference (`pnpm exec serve reference -l 4100`) and the build (`pnpm start -p 3100`); writes `qa/compare/<id>-{ref,new}.jpg` |

## Content

- **Projects, experience, tools, principles, journey, hero console:** `reference/content.json`. Edit it,
  then run `pnpm gen:content`.
- **Case studies:** `src/content/case-studies/<slug>.mdx` (typed frontmatter, see `src/content/case-schema.ts`).
  Text in `[ brackets ]` renders as a visible TODO tag.
- **Facts used across pages** (email, links): `src/content/site.ts`.
- **Photo:** `src/assets/abel.webp`. **Résumé:** `public/resume.pdf` (the button appears when the file exists).

## Environment

Copy `.env.example` to `.env.local` (or set the variables in Vercel):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, OG and JSON-LD (falls back to the Vercel production URL) |
| `RESEND_API_KEY` | Enables real email from the contact form (without it: compose, copy and mailto fallback) |
| `RESEND_FROM` | Sender on a domain verified in Resend |
| `CONTACT_TO` | Recipient (default `addis0132@gmail.com`) |

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel. The framework preset is Next.js and the
   package manager pnpm is detected from the lockfile.
2. Set the environment variables above for Production.
3. Deploy. Every page and image is static; only `/api/contact` runs as a function (Node.js runtime).

Or from the CLI: `pnpm dlx vercel` then `pnpm dlx vercel --prod`.

## Layout

```text
src/app/          routes, @modal (intercepted project overlay), api/contact, OG images, sitemap, robots
src/components/   chrome (nav, loader, shutter, cursor, footer), home/, about/, projects/, cases/, contact/, art/, ui/
src/hooks/        useIntroGSAP (entrances after first paint), useIdleGSAP (lazy section setup)
src/lib/          gsap, flip, anim helpers, intro gate, idle/lazy scheduler, scroll, overlay, seo, og
src/styles/       tokens + per-area CSS ported from the reference (prefixed class names)
src/content/      generated typed content + case-study MDX
tests/            e2e (Playwright), visual capture
reference/        the original kit (read-only)
```

---

## Original build kit

`PROMPT.md` is the build prompt this project was produced from. `reference/` holds the working single-file
reference (`reference/index.html`), its data, tokens, icons, the photo and 33 screenshots
(`d*` desktop light, `k*` desktop dark, `m*` mobile).
