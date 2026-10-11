# TODO for Abel

Things only you can provide. The site works without any of them: each one is hidden, marked or falls back
gracefully until you add it.

## 1. Résumé PDF

Save it as `public/resume.pdf`. On the next build, the **Résumé** button appears on the About page
(it is hidden while the file is missing).

## 2. Case-study content (placeholder text)

All five case studies are written as placeholder text in `src/content/case-studies.json`. Rewrite it in
your own words: each case has `sections` (Context, Design, Implementation, Validation, Reflection) made of
`body`, `points`, `decisions` (chose / over / why), `code` and `parts`. Keep "(simplified)" in code titles.
The Validation sections say what will be measured; add real numbers only once you have them.
After editing, run `pnpm gen:content` (it also runs before every build and fails on a malformed entry).
A case with no `sections` falls back to an outline built from `covers`.

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
- [ ] **Project links (live site and repo).** Each project in `reference/content.json` has
  `"links": { "live": null, "repo": null }`. Fill in an `https://` URL, then run `pnpm gen:content` (or just `pnpm build`).
  - `live`: the deployed product. When set, the project page shows a "Visit live site" button.
  - `repo`: the repository. When set, the project's "GitHub" button links to it instead of your profile (`github.com/Abel-40`).
  - Leave a value `null` if it isn't public. Anything other than `null` or an `https://` URL fails the build.

## 6. Optional

- [ ] **Real metrics.** The hero console replays illustrative numbers under a "sample request" label
  (`reference/content.json › heroConsole`). Replace them with real measurements if you have them, or keep
  the label.
- [ ] **Real-device check on iOS Safari.** Check `backdrop-filter` (glass), `svh` heights and the pinned
  sections on an iPhone. This Windows machine can only approximate it with Playwright's WebKit.
