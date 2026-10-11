# TODO for Abel

Things only you can provide. The site works without any of them: each one is hidden, marked or falls back
gracefully until you add it.

## 1. Résumé PDF

Save it as `public/resume.pdf`. On the next build, the **Résumé** button appears on the About page
(it is hidden while the file is missing).

## 2. Case-study content (placeholders)

Case studies are MDX files in `src/content/case-studies/`. Anything in `[ brackets ]` renders as a
dashed "To do" tag on the site, never as invented content. Replace each tag with real text.

**MoodVerse** (`moodverse.mdx`, published):

- [ ] 03 Implementation · Curating and validating the corpus: `[ Your validation rules and why ]`
- [ ] 03 Implementation · Handling reflections with weak matches: `[ What happens when nothing is relevant enough ]`
- [ ] 03 Implementation · Structured outputs and failure handling: `[ Schema, retries and fallbacks, with a snippet ]`
- [ ] 04 Validation · Retrieval relevance on the eval set: `[ __ % ]`
- [ ] 04 Validation · Size of the labelled eval set: `[ __ queries ]`
- [ ] 04 Validation · p95 end-to-end latency: `[ __ ms ]`
- [ ] 05 Reflection · What I would do differently: `[ One honest lesson ]`
- [ ] 05 Reflection · What comes next: `[ The next milestone for MoodVerse ]`

**Not written yet** (they show an outline and a link to the project):

- [ ] SEO Maker (`seo-maker.mdx`, status "In writing")
- [ ] Insight Stream (`insight-stream.mdx`, "Planned")
- [ ] AlertChain (`alertchain.mdx`, "Planned")
- [ ] Workroom (`workroom.mdx`, "Planned")

To write one, copy the structure of `moodverse.mdx`:

1. Add `sections:` to the frontmatter (n, key, title).
2. Replace the `<Outline>` block with `<Section>` blocks.
3. Update `status` and `read`.
4. Run `pnpm gen:content`. It also runs before every build, and fails if the frontmatter is malformed.

## 3. Contact form email (Resend)

Set these in Vercel (Project → Settings → Environment Variables) or in `.env.local`:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM` | A sender on a domain you verified in Resend, e.g. `Portfolio <hello@yourdomain.com>` |
| `CONTACT_TO` | Optional. Defaults to `addis0132@gmail.com` |

Without the key, the form falls back to the reference behaviour: it composes the message, copies it, and
offers an "Open in email app" link. `onboarding@resend.dev` only delivers to the Resend account owner's
address, so verify a domain before relying on it.

## 4. Production domain

Set `NEXT_PUBLIC_SITE_URL` (for example `https://abeladdis.dev`). It feeds canonical URLs, the sitemap,
robots.txt, Open Graph images and JSON-LD. On Vercel it falls back to the production `.vercel.app`
URL until you set it.

## 5. Please confirm

- [ ] **Contact email.** The kit uses `addis0132@gmail.com` everywhere. An earlier spec used
  `abel.addis.dev@gmail.com`. If that one is current, change `site.email` in `src/content/site.ts`.
- [ ] **Project GitHub links.** Each project's "GitHub" button points to your profile
  (`github.com/Abel-40`), as in the reference. Send repo URLs for any public repos and I'll link them directly.

## 6. Optional

- [ ] **Real metrics.** The hero console replays illustrative numbers under a "sample request" label
  (`reference/content.json › heroConsole`). Replace them with real measurements if you have them, or keep
  the label.
- [ ] **Real-device check on iOS Safari.** Check `backdrop-filter` (glass), `svh` heights and the pinned
  sections on an iPhone. This Windows machine can only approximate it with Playwright's WebKit.
