# Add project screens and case-study figures

> **How to use:** copy this folder into the repo you are already building (for example `kits/images/`), open Claude Code there and say:
> **"Read kits/images/PROMPT.md and follow it."**
> This is an add-on to the first build kit. It does not restart the build.

---

You are already rebuilding my portfolio from the first kit (`reference/index.html`, `content.json`, `tokens.css`, `DESIGN.md`, `PARITY.md`). The project cards use SVG illustrations (the `art` field and the `<template id="art-*">` drawings). This kit replaces those illustrations with real images:

- **20 project screens**: 4 per project, mixing light and dark interfaces.
- **5 case-study figures**: one figure per case study.

Your job is to integrate them into the pages I list below, matching the reference integration exactly. Then polish where it clearly helps.

## 0. Before you start

1. **Keep using the design skills.** Read `DESIGN.md` again. If the `/apple-design` skill is available, apply its rules to image presentation: material, depth, restrained motion and interruptible transitions. Add a **"Product imagery"** section to `DESIGN.md` covering:
   - the stacked-pair composition;
   - the gallery;
   - the case figure;
   - the radii, shadows and motion values from section 4.

   If a skill is missing, say so in one line and continue.
2. **Study the reference.**
   - From the **kit root** (not the `reference/` folder), run `npx serve .` and open `/reference/`. The reference page loads its images from `../public/images/`, so it has to be served from the kit root.
   - To see each piece:
     - **Home, Selected work:** scroll the rail.
     - **Projects page:** hover a card, then open one to see the hero pair and the "Inside the product" gallery.
     - **Case Studies page:** hover a row to see the preview, then open a case to see its figure.
   - The screenshots in `reference/look/` show the finished result in light, dark and mobile.
3. **Add the items in section 7 to `PARITY.md`.** Tick each one off as you build it.

## 1. What's in this kit

| Path | What it is |
|---|---|
| `public/images/projects/` | 20 project screens, each in 2 sizes: `name.webp` (1800×1125) and `name-sm.webp` (960×600). All are 16:10. |
| `public/images/cases/` | 5 case-study figures, in the same 2 sizes. |
| `data/project-screens.json` | Per project: `hue` (two colours), `cover` (which two screens form the card pair), and `shots` (file, label, light/dark theme, caption, alt, src, size). |
| `data/case-figures.json` | Per case study: `figure` (file, label "Figure 0N", caption, descriptive alt, src, size). |
| `reference/index.html` | The full portfolio with everything integrated. **Source of truth for every value.** |
| `reference/integration.css` | The CSS for these features, extracted from the reference. |
| `reference/integration.js` | The JS for these features (vanilla + GSAP), extracted from the reference. Port the behaviour and values, not the string-building style. |
| `reference/look/` | 18 screenshots of the finished integration. |
| `reference/contact-sheets/` | Overview sheets of every screen and figure. |

The screen files are named `<project>-<n>-<slug>`:

| Prefix | Project id | Screens (in gallery order) |
|---|---|---|
| `is-` | `insight` (Insight Stream) | search, feed, trending, detail |
| `mv-` | `mood` (MoodVerse) | result, reflect, mobile, history |
| `seo-` | `seo` (SEO Maker) | pipeline, finding, schema, provider. These show the AI layer only, which is my part of SEO Maker. |
| `ac-` | `alert` (AlertChain) | asset, alerts, notify, landing |
| `wr-` | `work` (Workroom) | planner, board, myday, access |

Case figures are named `cs-1-mood`, `cs-2-seo`, `cs-3-insight`, `cs-4-alert` and `cs-5-work`. Each matches the case-study `id` of the same name.

## 2. Assets

- Copy `public/images/` into the app's static folder (`public/` in Next.js, Vite or Astro), keeping the file names. Images must be served at `/images/projects/...` and `/images/cases/...`, which are the paths in the JSON.
- The images are already optimised WebP: about 3.2 MB for all 50 files, and about 30–50 KB for each small version.
  - Don't recompress or upscale them.
  - Don't crop the 16:10 ratio in the gallery or the case figure. Only the card compositions crop, and they do it on purpose by letting screens bleed off the edge.
- Always use both sizes through `srcset` (`-sm.webp 960w, .webp 1800w`) with a correct `sizes` value (see section 4).
  - With `next/image`, pass the 1800 px file with real `width`/`height` and a `sizes` value. Either let Next generate the widths, or set `unoptimized` and write the `srcset` yourself.
  - Never load the 1800 px file into a 300 px card slot.

## 3. Data

1. **Projects.** Merge `data/project-screens.json` into the projects in `content.json` by `id`, adding `hue`, `cover` and `shots`.
   - Remove the `art` field and the SVG art templates/components once nothing uses them.
   - The reference page stores each shot as a tuple, `[file, label, 'l' | 'd', caption]`. The JSON has the same data as objects.
2. **Cases.** Merge `data/case-figures.json` into the cases by `id`, adding `figure`.
3. **Types.** If the app uses TypeScript, add these types:

```ts
type Shot = { file: string; label: string; theme: 'light' | 'dark'; caption: string; alt: string; src: string; srcSm: string; width: 1800; height: 1125 };
type ProjectImagery = { hue: [string, string]; cover: { front: number; back: number }; shots: Shot[] };
type CaseFigure = { file: string; label: string; caption: string; alt: string; theme: 'light' | 'dark'; src: string; srcSm: string; width: 1800; height: 1125 };
```

Use the text exactly as written in the JSON (labels, captions and alt). Don't rewrite, expand or invent any of it (see section 6).

## 4. Components and where they go

### 4.1 `ProjectShots`: the stacked pair

**Where it goes:**
- Home "Selected work" rail cards (`.wc-art`);
- Projects grid cards (`.pc-art`);
- the project detail hero (`.po-art`).

**Layout:** two screens over a soft tinted panel.
- **Back screen:** `shots[cover.back]`, anchored top-right, bleeding off the right edge.
- **Front screen:** `shots[cover.front]`, anchored bottom-left, overlapping the back screen.

| Variant | Back: top / right / width | Front: bottom / left / width |
|---|---|---|
| Rail card, desktop (portrait slot) | 7% / −18% / 112% | 7% / 6% / 90% |
| Rail card, ≤ 860 px (landscape, 220 px tall) | 9% / −10% / 76% | −18% / 5% / 74% |
| Grid card (220 px tall) | 9% / −9% / 76% | −16% / 5% / 72% |
| Project hero (aspect 400/260) | 8% / −7% / 74% | −10% / 5% / 70% |

**Panel background** (uses the project's two `hue` colours):

```css
radial-gradient(90% 80% at 0% 100%, color-mix(in srgb, var(--h1) 28%, transparent), transparent 64%),
radial-gradient(80% 70% at 100% 0%, color-mix(in srgb, var(--h2) 24%, transparent), transparent 62%),
linear-gradient(165deg, var(--art-bg), var(--art-bg-2))
```

**Each screen:**
- `aspect-ratio: 16/10`;
- `border-radius: 10px` (12 px in the hero);
- this shadow:
  ```css
  box-shadow: 0 0 0 1px var(--sh-ring), 0 2px 6px -2px rgba(10,22,60,.18), 0 30px 60px -24px rgba(10,22,60,.55);
  ```
- the new `--sh-ring` token: light `rgba(12,28,70,.12)`, dark `rgba(170,200,255,.14)`.

**Motion:**
- **Grid card hover:** the front screen moves to `translateY(-10px)` and the back screen to `translate(8px,-6px)`, over `.8s` with the site ease.
- **Home rail:** scrubbed parallax inside the horizontal pinned rail, using `containerAnimation`.
  - Back screen: `xPercent -6 → 4`.
  - Front screen: `xPercent 7 → -5` and `yPercent 4 → -2`.
  - Both run from `start: 'left right'` to `end: 'right left'`.
- **Reduced motion:** turn off the parallax and hover movement.

**Loading:** `sizes` are `(max-width: 860px) 70vw, 460px` for rail and hero, and `(max-width: 760px) 70vw, 300px` for the grid. Lazy-load everything except the hero pair.

### 4.2 `ScreensGallery`: the project detail section

Put it on the project detail page as a new section titled **"Inside the product"**, after "The product" and before "Key capabilities". Use the same two-column section layout as the other sections.

**Parts:**
- **Viewer:**
  - 16:10, `border-radius: 22px` (16 px on mobile);
  - shadow `0 0 0 1px var(--sh-ring), 0 44px 90px -44px var(--shadow-c)`;
  - all four images stacked, with only the active one visible;
  - `sizes="(max-width: 860px) 94vw, 980px"`;
  - the first image loads eagerly and the rest lazily.
- **Arrows:** prev/next buttons, 46 px glass circles centred vertically 14 px from each edge.
  - They fade and slide in on hover of the viewer and are always visible on touch devices (`hover: none`).
  - Labels are "Previous screen" and "Next screen".
- **Caption row:**
  - a counter like `01 / 04` in mono;
  - the label as a display-font title;
  - the caption, with the caption container set to `aria-live="polite"`;
  - a **"Full size"** link (pill, expand icon) that opens the 1800 px file in a new tab.
- **Thumbnails:**
  - 4 columns (2 at ≤ 860 px);
  - each one is a button holding the `-sm` image (`alt=""`, because the label sits beside it), the label, and a small mono "Light" or "Dark" tag;
  - the active one uses the accent border with the accent-soft background, and has `aria-pressed`.
- **Note under the thumbnails**, with an info icon: **"Redesigned interface screens, shown with sample data."** It must stay (see section 6).

**Behaviour:**
- **Switching:** a crossfade.
  - The incoming image animates `autoAlpha 0 → 1` and `scale 1.03 → 1` over `.7s power3.out`, layered above the outgoing one, which is cleaned up after.
  - The title and caption animate `y 10 → 0` and `autoAlpha 0 → 1` over `.5s`, staggered `.05`.
- **Keyboard:** ← and → change the screen when focus is inside the gallery, wrapping around.
- **Reduced motion:** swap instantly.
- When the user opens a different project, reset the gallery to the first screen. The project view must always open scrolled to the top.

### 4.3 Case-study figure

**Where it goes:** on each case-study page, inside the header block, directly after the "System flow in …" card and before the table of contents and body grid. One figure per case study. It is full content width.

**Markup:**
- a `<figure>` holding a link to the 1800 px file (new tab, `aria-label="Open the figure full size"`);
- inside the link, an `<img>` with `srcset` for both sizes, `sizes="(max-width: 1280px) 94vw, 1180px"`, real `width`/`height`, and the descriptive `alt` from the JSON;
- a `<figcaption>` holding "Figure 0N" in mono accent text, followed by the caption.

**Style:**
- `border-radius: 24px` (16 px on mobile), with the same ring and shadow as the gallery viewer;
- on hover, the image scales to `1.012` and a 42 px glass zoom button fades in at the top-right. The button is always visible on mobile.

**Motion:** the figure reveals with the other header items (`y 30 → 0`, staggered).

### 4.4 Case-study list hover preview

On the Case Studies list, a 320 px preview card follows the cursor over the rows.
- **Image:** it shows that case's figure (the `-sm` file), with `object-fit: cover` in a 16:10 frame.
- **Follow:** it uses `gsap.quickTo` on x and y, with `.55s` and `power3`, offset `+28, −90`.
- **Enter:** `scale .8 → 1`, `rotation 0 → −3`, `autoAlpha 0 → 1`, over `.45s power3.out`.
- **Leave:** it reverses over `.35s`.
- **Preload:** preload the 5 small figures on first hover so the swap never flashes.
- **Devices:** pointer devices only.

## 5. Performance and accessibility

- Every `<img>` needs real `width` and `height` (or `aspect-ratio`) to prevent layout shift. The target is CLS < 0.05 on every page.
- `loading="lazy"` and `decoding="async"` on everything below the fold, but not on the project hero pair or the first gallery image.
- Alt text comes from the JSON:
  - Card and gallery images use `"<Project>: <Label>"`.
  - Case figures use the long descriptive alt.
  - Thumbnail images are decorative (`alt=""`).
- All controls are real buttons or links, with visible focus rings and hit targets of at least 44 px. Arrows and the zoom button need accessible names.
- Light and dark themes: the images don't change with the theme. They are a deliberate mix of light and dark interfaces, and only the panel behind them follows the theme tokens.

## 6. Honesty rules: do not break these

- The project screens are **redesigned interfaces shown with sample data**, built from each project's real features. Keep the gallery note.
- Never describe the screens as live screenshots, and never add metrics, user counts or "in production" wording.
- Each case figure carries its own footnote inside the image ("Illustrative figure…"). Don't crop it out.
- Don't present a planned case study as finished because it now has a figure. Its status pill stays as it is.
- SEO Maker shows only the AI layer, because that's my part. Don't add website-style screens for it.

## 7. Acceptance checklist (add to `PARITY.md`)

- ☐ Home "Selected work": every card shows its stacked pair from `cover`, with the hue panel; the rail parallax works; mobile layout matches look/14.
- ☐ Projects grid: the stacked pair is on every card; the hover lift works; matches look/03–05 and look/15.
- ☐ Project detail hero: the pair loads eagerly; matches look/06–07 and look/16.
- ☐ "Inside the product" gallery, with:
  - ☐ arrows;
  - ☐ thumbnails;
  - ☐ keyboard navigation;
  - ☐ the crossfade;
  - ☐ the Full size link;
  - ☐ the note;
  - ☐ a reset when switching projects.

  It must match look/08–09 and look/17.
- ☐ Case-study figure on all 5 case pages, with its caption and full-size link; matches look/12–13 and look/18.
- ☐ The case list hover preview shows the case figure; matches look/10–11.
- ☐ The old SVG art and the `art` field are removed, and nothing references them.
- ☐ No 404s for images, and no console errors.
- ☐ No horizontal scroll at 390 px.
- ☐ Light and dark both checked.
- ☐ Reduced motion respected.
- ☐ Lighthouse: CLS < 0.05, and no "properly size images" warnings for these images.

When you're done, show me screenshots of each item above next to the matching `reference/look/` image, and list anything you changed on purpose.
