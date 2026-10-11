---
version: 1.0
name: Abel Addis — Backend Engineer, AI Systems
description: >-
  A light, cool-blue engineering portfolio. A pale sky canvas carries navy ink and one electric blue
  (#1E66F5) with a cyan partner (#13A0E0). Frosted glass is the signature material: gradient glass
  cards over slowly drifting blurred colour orbs. Display type is a condensed Bricolage Grotesque with
  tight negative tracking; JetBrains Mono carries every "system" detail (paths, timings, status). Motion
  tells the story of a request moving through a backend: shutters that answer GET /about with 200 OK,
  packets travelling a diagram, a timeline drawn by scroll.
source-of-truth: reference/index.html + reference/tokens.css (this file describes them; it never overrides them)

colors:
  # canvas
  bg: "#EDF3FC"
  bg-2: "#E3ECF9"
  tint: "#D8E7FF"
  surface: "rgba(255,255,255,.72)"
  surface-solid: "#FFFFFF"
  field-bg: "rgba(255,255,255,.92)"
  nav-bg: "rgba(255,255,255,.64)"
  links-bg: "rgba(214,228,250,.7)"
  # text
  ink: "#0A1838"
  body: "#33456A"
  muted: "#56688C"
  # lines
  line: "rgba(16,44,104,.12)"
  line-strong: "rgba(16,44,104,.22)"
  # brand
  accent: "#1E66F5"
  accent-hover: "#1957D6"
  accent-text: "#1652CC"
  accent-2: "#13A0E0"
  accent-deep: "#1847B8"
  accent-soft: "rgba(30,102,245,.09)"
  accent-line: "rgba(30,102,245,.22)"
  accent-glow: "rgba(30,102,245,.5)"
  on-accent: "#FFFFFF"
  # deep navy band
  deep: "#0A1838"
  deep-2: "#14306E"
  on-deep: "#EAF1FF"
  on-deep-muted: "#A9BCE0"
  accent-on-deep: "#8CB8FF"
  deep-line: "rgba(200,220,255,.16)"
  chip-deep: "rgba(140,184,255,.12)"
  # status
  ok: "#0E9F57"
  ok-text: "#0B7A43"
  ok-soft: "rgba(14,159,87,.12)"
  warn: "#D2691C"
  warn-text: "#99470F"
  warn-soft: "rgba(210,105,28,.12)"
  warn-soft-solid: "#FFE6D3"
  neutral-soft: "rgba(16,44,104,.07)"
  # atmosphere
  glow-1: "rgba(120,175,255,.42)"
  glow-2: "rgba(130,215,255,.28)"
  glass-edge: "rgba(255,255,255,.88)"
  shadow-c: "rgba(20,58,140,.3)"
  # shutter bars (left → right)
  shutter-1: "{colors.accent}"
  shutter-2: "{colors.accent-deep}"
  shutter-3: "{colors.deep-2}"
  shutter-4: "{colors.deep}"

colors-dark:
  # applied by prefers-color-scheme: dark (unless [data-theme=light]) and by [data-theme=dark]
  bg: "#060D1F"
  bg-2: "#0A1530"
  tint: "#132A5A"
  surface: "rgba(17,31,64,.72)"
  surface-solid: "#0F1C3A"
  field-bg: "rgba(10,21,48,.92)"
  nav-bg: "rgba(10,20,44,.72)"
  links-bg: "rgba(30,50,96,.55)"
  ink: "#EAF1FF"
  body: "#B7C6E3"
  muted: "#8C9DC0"
  line: "rgba(150,180,255,.13)"
  line-strong: "rgba(150,180,255,.26)"
  accent: "#2F6EF0"
  accent-hover: "#3F7CF5"
  accent-text: "#82AEFF"
  accent-2: "#36C0F2"
  accent-deep: "#1D4CB8"
  accent-soft: "rgba(80,140,255,.14)"
  accent-line: "rgba(110,160,255,.3)"
  accent-glow: "rgba(47,110,240,.6)"
  deep: "#0E1F48"
  deep-2: "#173373"
  ok: "#22B86C"
  ok-text: "#5EE19C"
  ok-soft: "rgba(34,184,108,.16)"
  warn: "#E07B2E"
  warn-text: "#F3A86A"
  warn-soft: "rgba(224,123,46,.16)"
  warn-soft-solid: "#3A2414"
  neutral-soft: "rgba(150,180,255,.1)"
  glass-edge: "rgba(150,180,255,.16)"
  shadow-c: "rgba(0,0,0,.55)"
  glow-1: "rgba(47,110,240,.22)"
  glow-2: "rgba(19,160,224,.12)"

materials:
  # "rg" = refractive glass. The recipe used by the hero composition, journey band and How-I-build cards.
  rg-a: { light: "rgba(255,255,255,.74)", dark: "rgba(24,44,96,.72)" }
  rg-b: { light: "rgba(255,255,255,.36)", dark: "rgba(12,24,60,.42)" }
  rg-edge: { light: "rgba(255,255,255,.8)", dark: "rgba(150,180,255,.2)" }
  rg-hi: { light: "rgba(255,255,255,.95)", dark: "rgba(255,255,255,.08)" }
  rg-inset: { light: "rgba(255,255,255,.55)", dark: "rgba(255,255,255,.06)" }
  orb-opacity: { light: .5, dark: .4 }
  glass-recipe: >-
    background: radial-gradient(<tint> top-right), linear-gradient(140deg, var(--rg-a), var(--rg-b));
    backdrop-filter: blur(22–24px) saturate(1.6); border: 1px solid var(--rg-edge);
    box-shadow: inset 0 1px 0 var(--rg-hi), 0 30px 60px -32px var(--shadow-c)
  orb-hues: ["#2F6EF0", "#36C0F2", "#5B6CFF", "#7CC4FF", "#1D4CB8", "#4F5BFF"]

typography:
  display-hero:      { fontFamily: "Bricolage Grotesque", fontWeight: 740, fontStretch: 88%, fontSize: "clamp(46px, 5.6vw, 92px)", lineHeight: .94, letterSpacing: -.035em }
  h1:                { fontFamily: "Bricolage Grotesque", fontWeight: 750, fontStretch: 82%, fontSize: "clamp(44px, 6.6vw, 100px)", lineHeight: .94, letterSpacing: -.04em }
  h2:                { fontFamily: "Bricolage Grotesque", fontWeight: 720, fontStretch: 86%, fontSize: "clamp(34px, 4.6vw, 66px)", lineHeight: 1, letterSpacing: -.035em }
  cta-title:         { fontFamily: "Bricolage Grotesque", fontWeight: 760, fontStretch: 80%, fontSize: "clamp(50px, 8.6vw, 136px)", lineHeight: .9, letterSpacing: -.045em }
  statement:         { fontFamily: "Bricolage Grotesque", fontWeight: 650, fontStretch: 90%, fontSize: "clamp(30px, 4.3vw, 62px)", lineHeight: 1.08, letterSpacing: -.03em }
  case-question:     { fontFamily: "Bricolage Grotesque", fontWeight: 720, fontStretch: 86%, fontSize: "clamp(32px, 4.2vw, 60px)", lineHeight: 1.04, letterSpacing: -.035em }
  rule-title:        { fontFamily: "Bricolage Grotesque", fontWeight: 750, fontStretch: 82%, fontSize: "clamp(32px, 3.9vw, 58px)", lineHeight: .96, letterSpacing: -.04em }
  project-name-xl:   { fontFamily: "Bricolage Grotesque", fontWeight: 760, fontStretch: 80%, fontSize: "clamp(48px, 7vw, 108px)", lineHeight: .9, letterSpacing: -.045em }
  card-title:        { fontFamily: "Bricolage Grotesque", fontWeight: 750, fontStretch: 84%, fontSize: "clamp(32px, 3vw, 46px)", lineHeight: 1, letterSpacing: -.035em }
  card-title-sm:     { fontFamily: "Bricolage Grotesque", fontWeight: 720, fontStretch: 86%, fontSize: 28px, lineHeight: 1.05, letterSpacing: -.025em }
  numeral-outline:   { fontFamily: "Bricolage Grotesque", fontWeight: 800, fontStretch: 75%, lineHeight: .8–.85, letterSpacing: "-.04em to -.05em", fill: transparent, stroke: "1.4–1.5px accent" }
  numeral-solid:     { fontFamily: "Bricolage Grotesque", fontWeight: 750–800, fontStretch: 75–80%, fontVariantNumeric: tabular-nums }
  wordmark-giant:    { fontFamily: "Bricolage Grotesque", fontWeight: 800, fontStretch: 75%, fontSize: "min(17vw, 260px)", lineHeight: .8, letterSpacing: -.05em }
  lead:              { fontFamily: "Instrument Sans", fontSize: "clamp(17px, 1.35vw, 19.5px)", lineHeight: 1.62, maxWidth: 60ch }
  body:              { fontFamily: "Instrument Sans", fontSize: 16px, lineHeight: 1.6 }
  body-reading:      { fontFamily: "Instrument Sans", fontSize: 17px, lineHeight: 1.7–1.75, maxWidth: 68ch }
  kicker:            { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 14.5px, lineHeight: 1.3 }
  button:            { fontFamily: "Instrument Sans", fontWeight: 650, fontSize: 15.5px, lineHeight: 1 }
  nav-link:          { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 14.5px }
  chip:              { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 12.5px, lineHeight: 1.4 }
  mono-label:        { fontFamily: "JetBrains Mono", fontWeight: 500, fontSize: "11.5–13.5px" }
  mono-code:         { fontFamily: "JetBrains Mono", fontWeight: 500, fontSize: 12–12.5px, lineHeight: 1.6 }
  brand-name:        { fontFamily: "Bricolage Grotesque", fontWeight: 700, fontStretch: 90%, fontSize: 17.5px, letterSpacing: -.01em }
  brand-name-accent: { fontFamily: "Instrument Serif", fontStyle: italic, fontWeight: 400, fontSize: 1.24em, color: "{colors.accent-text}" }
  monogram:          { fontFamily: "Great Vibes", fontSize: 24.5px, letterSpacing: -2.3px, color: "#FFFFFF" }

rounded:
  xs: 6px      # focus ring corner, head tag
  sm: 8px      # verb badge, placeholder tag, flow chip inner
  md: 11–12px  # tool logo tile, nav link, mini-btn, links pill
  lg: 14px     # brand mark, flow pill, tool card, menu button
  xl: 16px     # links tray, form fields, feature item, jr-node
  2xl: 18px    # experience card, ph-tag
  3xl: 20–22px # console/glass cards, project art inset, preview
  4xl: 24–26px # boards, tabs, terminal, journey panel, reader flow
  5xl: 28px    # project card, reader section, edu card
  6xl: 30–32px # rule card, work card, form card, photo frame
  band: 34px   # journey band (60px while entering)
  pill: 999px

spacing:
  base: 4px
  gutter: "clamp(16px, 4vw, 40px)"
  wrap-max: 1280px
  band-max: 1680px
  section-y: "clamp(90px, 11vw, 150px)"       # principles, career log
  section-y-lg: "clamp(100px, 13vw, 180px)"   # statement
  page-hero-top: 150px (desktop) / 120px (≤899px)
  nav-offset: 14px + safe-area-inset-top
  stack-gap: [6, 8, 10, 12, 14, 18, 22, 26, 32, 40, 56]

motion:
  ease-css: "cubic-bezier(.2, .7, .2, 1)"       # every CSS transition (hover, pills, cursor)
  ease-enter: "power3.out"                     # rises, fades, panels
  ease-type: "power4.out"                      # split-character headline reveals
  ease-cover: "power4.inOut"                   # shutter bars
  ease-expand: "expo.inOut"                    # loader panels, overlay clip, photo reveal
  ease-pop: "back.out(1.5–2.6)"                # chips, cards flying in, tool tiles
  ease-spring: "elastic.out(1, .45)"           # magnetic return; ball uses elastic.out(1, .5)
  dur-micro: .2–.35s
  dur-ui: .45–.62s
  dur-reveal: .8–1.1s
  dur-cinematic: 1.3s
  breakpoints: { desktop: ">= 900px", tablet-tight: "900–1099px", mobile: "< 900px", small: "< 600px" }

components:
  button-accent:      { background: "{colors.accent}", color: "{colors.on-accent}", rounded: pill, height: 52px, padding: "0 24px", typography: button, shadow: "0 16px 30px -16px {colors.accent-glow}", hover: "{colors.accent-hover}" }
  button-ghost:       { background: "{colors.surface}", color: "{colors.ink}", border: "1px {colors.line-strong}", backdrop: "blur(12px)", rounded: pill, height: 52px, hover: "border accent, text accent-text" }
  button-light:       { background: "{colors.on-deep}", color: "#0A1838", rounded: pill, hover: "#FFFFFF" }
  button-ghost-deep:  { background: transparent, color: "{colors.on-deep}", border: "1px {colors.deep-line}", hover: "border accent-on-deep" }
  button-sm:          { height: 44px, padding: "0 18px", fontSize: 14.5px }
  icon-btn:           { size: 48px, rounded: 50%, background: "{colors.surface-solid}", border: "1px {colors.line-strong}" }
  mini-btn:           { size: 44px, rounded: 12px, background: "{colors.surface-solid}", border: "1px {colors.line-strong}" }
  link-arrow:         { color: "{colors.accent-text}", typography: "650 15px Instrument Sans", minHeight: 44px, arrow: "translateX(4px) on hover" }
  chip:               { background: "{colors.accent-soft}", border: "1px {colors.accent-line}", color: "{colors.accent-text}", rounded: pill, padding: "5px 11px", typography: chip }
  status-pill:        { rounded: pill, padding: "4px 11px", typography: "650 12.5px", dot: "6px currentColor", variants: { Published: ok, "In development|In writing": dev (accent), Planned: soft (muted), other: ext (warn) } }
  kicker:             { color: "{colors.accent-text}", typography: kicker, leadingRule: "28×2px currentColor" }
  section-marker:     { num-pill: "40×28 accent pill, mono 12.5px", label: "650 14.5px ink", line: "1px line-strong, accent→accent-2 fill draws scaleX 0→1 on scroll", end-dot: "7px accent-2 with 4px accent-soft halo" }
  nav-pill:           { position: fixed, top: "14px + safe-area", maxWidth: 1280px, rounded: 22px, padding: 7px, background: "{colors.nav-bg}", border: "1px {colors.glass-edge}", backdrop: "blur(18px) saturate(160%)" }
  nav-links-tray:     { background: "{colors.links-bg}", rounded: 16px, padding: 4px, link: "44px, 0 16px, muted → ink", active-pill: "surface-solid, 12px radius, slides under hovered/active link" }
  availability-chip:  { height: 38px, rounded: pill, background: "{colors.surface}", border: "{colors.glass-edge}", pulse-dot: "8px ok with 2.2s ping ring" }
  brand-mark:         { size: 42px, rounded: 14px, background: "linear-gradient(135deg, accent 0%, #2C8BF2 55%, accent-2 100%)", gloss: "radial highlight top-left", glyph: "AB in Great Vibes, white", hover: "rotate(-8deg) scale(1.04) + sheen sweep" }
  glass-card:         { material: glass-recipe, rounded: 22px, tint: "radial rgba(14,143,208,.16) top-right", blur: "22px", parallax-depth: "--d: 10–30" }
  console-card:       { extends: glass-card, bar: "rg-inset bg, 3 dots (accent, accent-2, line-strong), 'sample request' mono label, project chip", body: "verb badge + path + status pill, request pre, 3 trace rows (70px label / bar / 54px ms), response pre 8em" }
  glass-band:         { material: glass-recipe, rounded: "34px (60px entering)", tints: "radial #0E8FD0 24% top-right + #5ED0FF 14% bottom-left", auras: "620/560/460px blurred orbs (#36C0F2, #5B6CFF, #2F6EF0)", blur: 24px }
  rule-card-light:    { material: glass-recipe, rounded: 30px, tint: "color-mix(--rc 24%) top-right + color-mix(--rc2 14%) bottom-left", text: ink }
  rule-card-color:    { rounded: 30px, background: "radial --rc2 60% top-right + linear-gradient(140deg, --rc 88%, --rc 66%)", text: "#FFFFFF", border: "rgba(255,255,255,.3)" }
  work-card:          { size: "clamp(560px,62vw,880px) × min(62vh,540px)", rounded: 32px, columns: "art 1fr / body 1.08fr", tones: { 1: surface, 2: deep (on-deep text), 3: surface, 4: tint } }
  work-end-card:      { width: "clamp(300px,28vw,400px)", rounded: 32px, background: "{colors.accent}", color: "{colors.on-accent}" }
  project-card:       { rounded: 28px, background: "{colors.surface}", art: "220px, 20px radius, inset 10px", hover: "accent-line border + deeper shadow + art scale 1.05 + 3D tilt ±4°" }
  experience-card:    { maxWidth: 430px, rounded: 18px, background: "{colors.surface-solid}", lit: "accent-line border + accent glow shadow" }
  terminal:           { rounded: 26px, bar: "{colors.term-bar} navy with 3 dots, mono 13px", body: "{colors.term-bg}" }
  tool-card:          { rounded: 14px, logo-tile: "36px, 11px radius, brand 13% tint", hover: "lift 4px, tile fills brand, logo rotates -8° (spring)" }
  segmented-tabs:     { rounded: 26px, padding: 5px, active-pill: "ink (tabs) / accent (filters), slides with .5s ease" }
  field:              { height: 58px, rounded: 16px, background: "{colors.field-bg}", border: "1px {colors.line-strong}", label: "floating, scales .78 and moves up 10px, accent-text", focus: "accent border + 4px accent-soft ring" }
  send-button:        { height: 58px, rounded: pill, full-width, morphs to 58px circle with spinner }
  toast:              { rounded: 16px, background: "{colors.ink}", color: "{colors.bg}", position: "bottom center + safe-area", enter: "translateY(140% → 0) .5s" }
  shutter:            { bars: 4 vertical, colors: [accent, accent-deep, deep-2, deep], label: "mono: [GET] /path 200 OK" }
  loader:             { background: "{colors.deep}", split: "two 50.5% panels", log: "mono 13.5/1.75, ✓ in #6EE7A8", counter: "Bricolage 800/75% clamp(76px,16vw,168px)", bar: "2px accent→accent-2" }
  cursor:             { ring: "34px, 1.5px accent", link: "54px + accent-soft fill", labelled: "86px solid accent with 13px label" }
  placeholder-todo:   { rounded: 8px, border: "1.5px dashed {colors.accent-line}", background: "{colors.accent-soft}", color: "{colors.accent-text}", typography: "500 13px JetBrains Mono" }
---

# DESIGN.md — Abel Addis portfolio

> **Contract.** Every component in this repo follows this file. The values come from `reference/index.html`
> and `reference/tokens.css`; when this file and the reference disagree, the reference wins and this file
> gets corrected. The only intentional departures are listed in **Polish** (and mirrored in `PARITY.md`).

## Overview

The site reads like a well-instrumented backend: calm, cool-blue, precise. It has three layers:

1. **Canvas.** A pale sky (`--bg #EDF3FC`) washed by two fixed radial glows (`--glow-1` top-right, `--glow-2` left).
2. **Content.** Navy ink type, translucent white surfaces, hairline borders (`--line`).
3. **Glass.** Frosted gradient cards that float over blurred colour orbs. Glass is used for the hero
   composition, the request-journey band, the How-I-build stack, the nav and the contact form.

Personality comes from three things only:

- **Condensed display type.** Bricolage Grotesque at 75–90% width with tight tracking.
- **One electric blue and its cyan partner.** Gradients only ever run accent → accent-2.
- **Engineering details in mono.** HTTP verbs, paths, `200 OK`, ms timings, `NN / 06` counters, `$ git log`.

Dark mode is a deep navy night (`#060D1F`). The same structure carries over, with glass tinted navy and
accents lifted for contrast.

## Colors

### Brand & accent

- **Accent `#1E66F5`** (dark `#2F6EF0`) is the only fill colour for primary actions, active filter pills,
  section number pills, the work-rail end card and the CTA ball.
- **Accent-2 `#13A0E0`** (dark `#36C0F2`) is the partner. It appears as the gradient end, the caret, the
  timeline head and halo, and the journey's packet glow. It is never used alone as a large fill.
- **Accent-text `#1652CC`** (dark `#82AEFF`) is the text-safe accent for links, kickers, chips and labels.
  Never set text in `--accent` on `--bg`; use `--accent-text`.
- **Accent-deep `#1847B8`** is used only as the second shutter bar.
- Gradient rule: `linear-gradient(90deg | 110deg | 135deg, var(--accent), var(--accent-2))`. Brand mark
  only: accent → `#2C8BF2` → accent-2.

### Surfaces

`--bg` → `--bg-2` (banded sections: marquee, experience) → `--tint` (4th work card) →
`--surface` (72% white, translucent cards) → `--surface-solid` (#FFF: fields, nodes, xp cards, tool cards).
`--field-bg` is for inputs, `--nav-bg` and `--links-bg` for the nav.

### Text

`--ink` for headings and important values, `--body` for paragraphs, `--muted` for meta, labels and mono
annotations. On navy: `--on-deep`, `--on-deep-muted`, `--accent-on-deep`.

### Lines

`--line` (12%) for card borders and dividers. `--line-strong` (22%) for section rules, dashed diagram
paths and outlined numerals at rest.

### Status

| Pill | Text | Background | Used for |
|---|---|---|---|
| ok | `--ok-text` | `--ok-soft` | Published, "Current", `200 OK` |
| dev | `--accent-text` | `--accent-soft` | In development, In writing |
| soft | `--muted` | `--neutral-soft` | Planned |
| ext | `--warn-text` | `--warn-soft` | anything else (e.g. "Adding an AI trading assistant") |

### Deep navy band

`--deep #0A1838` with a 56px grid (`--deep-line`) masked to the top-right and a 700px accent radial
glow. Used by the case band, the loader, the mobile menu and the 2nd work card.

### Illustration palette (`--art-*`)

`art-bg → art-bg-2` panel gradient (165deg), `art-card` white cards with `art-stroke`, `art-bar`
skeleton text, `art-soft / art-mid / art-mid-2` blue chips, `art-inkbox` the single dark notification,
plus `accent`, `accent-2`, `ok`, `warn` for semantic dots. All five illustrations use only these
classes, so they flip correctly in dark mode.

### Journey and diagram colours

`--graph-*` and `--terrain-*` tokens, plus fixed glows: lane B `#5B6CFF`, packet halo `accent-2`.

### Hard-coded hues (allowed list)

The orb hues (`#2F6EF0 #36C0F2 #5B6CFF #7CC4FF #1D4CB8 #4F5BFF`), the per-card rule hues (see How I
build), the brand-logo colours from `icons.json`, the loader's `#6EE7A8` check green, and white.
Everything else must be a token.

## Materials

### The glass recipe ("rg")

```css
background:
  radial-gradient(90% 120% at 100% 0%, <tint 16–24%>, transparent 60%),
  linear-gradient(140deg, var(--rg-a), var(--rg-b));
border: 1px solid var(--rg-edge);
box-shadow: inset 0 1px 0 var(--rg-hi), 0 30px 60px -32px var(--shadow-c);
backdrop-filter: blur(22px) saturate(1.6);   /* 24px on bands and rule cards */
```

Behind every glass group there are **orbs**: large circles (340–620px) of the orb hues, blurred
64–80px, at `opacity: var(--orb-o)` (.5 light / .4 dark). They drift on 14–23s alternate loops or
on scroll, so the glass visibly changes colour.

| Surface | Variant |
|---|---|
| Hero cards (console, metric, queue, time pill, logo chips) | rg + cyan tint `rgba(14,143,208,.16)`, 22px blur |
| Journey band | rg + `#0E8FD0` 24% top-right + `#5ED0FF` 14% bottom-left, 24px blur, 34px radius |
| Journey panel / stage | `--rg-inset` fill, `--rg-edge` border, 12–16px blur |
| How-I-build light cards (1, 3, 5) | rg + `--rc` 24% / `--rc2` 14% tints |
| How-I-build coloured cards (2, 4, 6) | stained glass: `--rc` at 88% → 66%, `--rc2` 60% top-right, white text |
| Nav pill | `--nav-bg`, `blur(18px) saturate(160%)`, `--glass-edge` border |
| Form card | `--surface`, `blur(20px) saturate(150%)` |
| Ghost buttons, kicker pill, ph-tag | `--surface` with 10–14px blur |

### Elevation & depth

One shadow language: a soft, long, negative-spread drop in `--shadow-c`, plus an inset top highlight.

- `--shadow`: `inset 0 1px 0 rgba(255,255,255,.7), 0 24px 50px -30px var(--shadow-c)` (default card)
- glass: `0 30px 60px -32px`; bands: `0 40px 90px -44px`; photo and form: `0 50px 90px -50px`
- accent glow under primary actions: `0 16px 30px -16px var(--accent-glow)`
- Lit or active states add a coloured glow (`--accent-glow`, accent-2 drop-shadows on SVG paths).
- No hard shadows, and nothing with a blur under 18px except the small tiles.

## Typography

### Families

| Role | Family | Axes used |
|---|---|---|
| Display, headings, numerals | **Bricolage Grotesque** | opsz 12–96, wdth 75–100, wght 200–800 |
| Body, UI | **Instrument Sans** | wdth 75–100, wght 400–700 |
| Labels, code, meta | **JetBrains Mono** | 400/500/600 |
| Wordmark accent "*Addis*" | **Instrument Serif** italic | — |
| Monogram "AB" | **Great Vibes** | — |

### Hierarchy

See `typography:` in the front matter. The rules:

- Headings always use `font-stretch` 75–90% and negative tracking (−.02 to −.05em), tighter as size grows.
  Line height runs .85–1.08 for display and 1.1–1.25 for small headings.
- Numerals (counters, years, watermarks, loader) are 75% width, weight 800, `tabular-nums`, and often
  **outlined**: transparent fill with a 1.4–1.5px stroke in accent or line-strong. An outlined numeral fills
  with the accent gradient when it becomes "current".
- Body copy never goes below 16px. Lead copy is 17–19.5px at 1.62.
- Mono is for anything a machine would print: verbs, paths, timings, `stage 2 of 6`, periods, kind
  labels, route hints.
- Headings use `text-wrap: balance`. Hover on large "next" links animates `font-stretch` 80% → 100%.

## Layout

- **Column:** `.wrap`, 1280px max, gutter `clamp(16px, 4vw, 40px)`, left-aligned compositions.
- **Full-bleed motion bands** break the column: the request journey (12px inset, 1680px max), the
  horizontal work rail (track padded to align with the column) and the navy case band.
- **Breakpoints:** ≥1100 full desktop; 900–1099 tight desktop (availability chip hidden, console widened);
  <900 mobile (hamburger, stacked hero, journey list, vertical work stack, left spine timeline);
  <600 small (wordmark hidden, single-column forms and creds, 2-column tool board).
- **Section rhythm:** big vertical air (100–180px) between home sections, smaller (40–80px) inside pages.
- **Z-layers:** content 0–4, cs-preview 40, mobile menu 45, nav 50, progress 60, project overlay 80,
  cursor 105, shutter 110, loader 120, toast 130, skip link 200.

## Shapes

Large and soft. Radius grows with the size of the surface (see `rounded:`). Pills (999px) are for chips,
buttons, segmented pills and status. Circles are for icon buttons, the CTA ball and timeline dots. There
are no sharp corners anywhere except 1–3px progress bars and lines (which still use rounded caps).

## Iconography

- **UI icons:** 24×24, `stroke: currentColor`, width 1.8, round caps and joins, no fill (`icons.json → ui`).
  Rendered at 18px (13–24px by context). Arrows nudge 4px on hover.
- **Tool icons:** brand marks from `icons.json → brands` (Simple Icons CC0 / Devicon MIT) in brand colours.
  `k: d` marks use `currentColor`; `k: l` (light) marks are mixed 70% with navy in light mode. Tools
  without a logo use `generic` stroke icons in accent-text.
- **Illustrations:** the five project arts are built from simple shapes only (cards, bars, chips, chart,
  bookmark, check, arrows) with `--art-*` classes and gentle CSS loops (blink, draw, float, scan, ring,
  drop, fill, dash).

## Motion

### Principles

1. **Motion explains the system.** It shows requests travelling, timelines drawing and status flipping
   from pending to `200 OK`. It is never decoration for its own sake.
2. **Scroll is the timeline.** Long sequences (journey, timeline, rail, statement, footer name) are scrubbed,
   so the reader controls the pace and can reverse it.
3. **Enter once, then rest.** Reveals (`rise`, split headings) play once per page view.
4. **Physical feedback uses springs** (magnetic buttons, CTA ball, tool tiles). Everything else uses
   power/expo curves.
5. **Interruptible.** Any tween can be overwritten mid-flight. Nothing waits for an animation to finish
   before accepting input, except the shutter's ~1.1s cover, which absorbs and redirects a second click.

### Curves & durations

| Name | Curve | Duration | Where |
|---|---|---|---|
| CSS ease | `cubic-bezier(.2,.7,.2,1)` | .25–.55s | hovers, pills, cursor size, nav hide |
| rise | power3.out, y 46 → 0, fade | 1s, stagger .08, start `top 86%` | most content |
| split chars | power4.out, yPercent 118–120 | 1.05–1.1s, stagger .014–.02 | H1s |
| split words | power4.out, yPercent 115 | 1.1s, stagger .07 | CTA title |
| shutter in/out | power4.inOut | .62s / .68s, stagger .055 | route change |
| loader | power2.inOut count, expo.inOut panels | 1.3s count, .85s split | first load |
| overlay | expo.inOut clip-path | .85s open / .7s close | project detail |
| pop | back.out(1.5–2.6) | .5–1s | chips, hero cards, xp cards, tool tiles |
| spring | elastic.out(1, .45) | .6s | magnetic return |
| ball | elastic.out(1, .5) | 1.2s | CTA ball |
| scrub | scrub .4–.8 | — | statement .4, xp .5, journey .6, rail .8 |

### Signature motions

- **Loader:** terminal log types in, 000 → 100, then the panels split top and bottom. A click speeds it ×4.
- **Shutter:** four bars sweep up, `GET /about` appears, `200 OK` pops in, the page swaps underneath,
  and the bars exit upward.
- **Monogram:** the AB strokes draw in (dashoffset 240 → 0, 1.6s), then fill.
- **Hero:** chars rise, the rotating word slides out and in while its width animates, cards fly in rotated
  with back easing, and the console replays sample requests.
- **Journey:** pinned for 2.8 viewport heights; paths draw, a packet with trail and halo travels the
  route, a data tag rides above the packet, and nodes light up with a ring burst.
- **Timeline:** scroll draws a winding path; the head dot reaches a card's dot, then the card slides in
  from the spine.
- **How-I-build stack:** sticky cards; the previous card scales to .92 and dims toward `--bg`.
- **Footer:** "Abel Addis" letters rise one by one as the footer scrolls in.

## Components

The front matter has the measurable specs. Behavioural notes:

- **Nav pill.** Fixed and floating. It hides (translateY −100% − 12px, .55s) after scrolling down past
  260px and shows on scroll up. It is force-hidden while the journey is pinned. Under 900px the link tray
  and the CTA collapse into a 46px menu button, which opens a full-screen navy menu (circle clip from the
  top-right, .75s power3.inOut) with 38–64px links, mono route hints, the availability chip and the email.
- **Section marker.** `[01] What I care about ———•`. The line fills (scrub, `top 94%` → `top 55%`) and the
  pill and label pop (back.out(2)).
- **Hero console.** Labelled "sample request". The numbers are illustrative and must stay labelled.
  Request JSON types at ~26ms/char (max 1.1s). Trace bars grow in sequence. Response lines print every
  80ms with syntax colours: keys accent-text, strings ok-text, numbers and booleans warn-text. The status
  pill pops (back.out(3)), then it holds for 2.8s.
- **Journey diagram.** 640×400 viewBox. Nodes are HTML pills positioned in viewBox units over an SVG.
  The background routes are dashed (3 8); the live paths use the accent → accent-2 gradient at 3.2px.
  The data-tag pill is ink with a bg-coloured mono label and a gradient icon dot.
- **Experience timeline.** A cubic-Bézier path weaves ±36px about the centre (±8px about x=20 on mobile).
  The dots are 8px and a ring bursts to r 30. Cards alternate sides and overlap by −46px. The years sit
  opposite, outlined, and fill when lit.
- **How-I-build card.** Top row: `01 / 06` index pill, a gradient hairline, and a 50px icon tile.
  Bottom: title and description on the left, a "Where it shows up" proof panel on the right with project
  tag buttons. A 110–190px outlined watermark number parallaxes. Hues by card:
  1 `#2F6EF0/#6FA5FF` light · 2 `#1F5BE0/#36C0F2` colour · 3 `#0E8FD0/#5ED0FF` light ·
  4 `#2340B8/#4F7BFF` colour · 5 `#4F5BFF/#8FA0FF` light · 6 `#1670E0/#36C0F2` colour.
- **Work card.** The art panel sits on the left (165deg art gradient, 22px radius). The body holds an
  outlined `01` numeral, status, name, tagline, hook, chips, and a footer with "Open project →" and the
  mono kind label.
- **Project detail.** A sticky bar with breadcrumb `‹ projects / slug` (where "projects" is a link) and
  prev, next and close icon buttons. Then a two-column hero, then sections on a 220px label column:
  problem (large quote), product, capabilities (two-column checklist), flow (numbered pills joined by
  animated wires), stack (grouped chips), CTAs, and a giant "Next project" link.
- **Career log.** A terminal card running `$ git log --career`. Commits are expandable (height tween)
  with a chevron. A rail fill and a travelling head light each commit's dot as it is passed.
- **Tools board.** A segmented tab bar with a sliding ink pill. The grid is auto-fill 168px (2 columns
  under 600px). A cursor spotlight (`--mx/--my` radial in accent-soft) follows the pointer. Flip
  re-flows the board on tab change.
- **Case rows.** A large outlined number that fills on hover, a title and question, project and status,
  and a 52px arrow button that rotates −45° and fills. The row background wipes up from the bottom.
  A floating art preview (300px, rotated −3°) follows the cursor.
- **Reader.** A back pill, meta, a split H1, an "engineering question" block, a "System flow" strip, and
  a 220px sticky TOC with scroll-spy beside the section cards. **Placeholders** (`[ … ]`) render in the
  dashed mono `placeholder-todo` style and must stay visibly marked as TODO.
- **Contact form.** Floating-label fields on a glass card. Errors show an inline note and an elastic
  shake (x −8 → 0, elastic.out(1, .3)). The send button shrinks to a 58px circle with a spinner, then a
  success panel draws its check (.7s).

## Do's and Don'ts

### Do

- Use `--accent-text` for any accent-coloured text, and `--accent` only for fills, strokes and glows.
- Keep mono for machine output and Instrument Sans for human sentences.
- Put glass over something: orbs, the canvas glow, or content. Glass over flat colour looks like grey plastic.
- Pair every animated state with a complete static state (reduced motion, no JS).
- Keep illustrative numbers labelled ("sample request"). Keep `[ placeholders ]` visibly marked.

### Don't

- Introduce another brand colour, a purple or green CTA, or gradients outside accent → accent-2.
- Use full-width condensed type for body text, or tracking tighter than −.02em under 28px.
- Use drop shadows under 18px blur or with positive spread.
- Stack glass on glass more than two levels deep (band → panel is the limit).
- Animate layout properties on scroll (width, height, top). Use transform, opacity, clip-path,
  stroke-dashoffset and SVG attributes only.

## Responsive behavior

| Area | ≥900px | <900px |
|---|---|---|
| Nav | pill: brand, link tray, availability chip, Let's talk | brand and menu button; full-screen menu |
| Hero | 2 columns, full glass composition, scroll cue | stacked; console, metric card and time pill only |
| Journey | pinned band with panel and diagram | vertical numbered list of 6 stages |
| Work | pinned horizontal rail and end card | vertical stack, art on top |
| Experience | centred winding spine, alternating cards, years | left spine (±8px wiggle), cards full width, no years |
| How I build | sticky cards, top offset 100 + 18px·i | top 84 + 12px·i, single column, no watermark |
| Case band, About, Contact, Reader | 2 columns | 1 column; TOC hidden |

- Touch targets are ≥44px everywhere (see Polish).
- Use `svh` for full-height sections so iOS's toolbar doesn't jump.
- Safe-area insets apply to the nav, menu, overlay bar and toast.

---

## Polish

The `/apple-design` rules, applied as a detail layer. **Identity and layout win.** These rules change
easing, spacing, contrast and states only. Each departure from the reference is also logged in `PARITY.md`.

### 1. Hierarchy & optical sizing

- **Optical sizing.** `font-optical-sizing: auto` is on for Bricolage, so display sizes use the opsz 96
  cut and small headings the text cut. This sharpens small headings without changing the look.
  *(Guideline: Typography › variable fonts and optical sizing.)*
- **One family per role.** The five families stay, each with a single job. No new faces.
- **Minimum sizes.** UI text must be at least 11px. The reference uses 10–10.5px in three places (tool
  group label, mobile tool label, journey data tag). These go up to 11px. *(Guideline: Typography ›
  minimum size 11pt mobile.)*
- **Weight floor.** No weights under 400 for text.
- **Text styles.** Weight and tracking come from the scale only, never ad hoc.

### 2. Spacing rhythm

- Use a 4px base grid. Gaps snap to 4/6/8/10/12/14/18/22/26/32/40/56 (the reference's own steps).
- Use the same inner padding for siblings: glass cards 14–18px, panels 22–36px clamp, sections from the
  table above.
- **Optical alignment.**
  - Arrow icons in buttons get −1px optical offset.
  - Outlined numerals align on the cap line, not the em box.
  - Pills with a leading dot use asymmetric padding (left 11 / right 11 with a 7px gap), as the reference does.

### 3. Motion (restrained, interruptible, natural)

- **Never block input.**
  - The loader shows at most once per session. Click, Esc or any key skips it (×4 speed, then done), and
    it carries a visible "Skip" button.
  - During the shutter, a second navigation request is queued and replaces the pending target. It is not
    dropped.
- **Shorter on return.** Back and forward use a single fast sweep (≈.45s total) instead of the full
  cover-label-reveal sequence.
- **Interruptible tweens.** Use `overwrite: 'auto'` and `quickTo` for every pointer-driven motion. Hover
  states are CSS transitions that reverse from any point.
- **Natural curves.** Keep the reference curves. One refinement: press states get a 100ms
  `scale(.97)` on `:active` for buttons, icon buttons, tabs, filters and cards. This gives feedback within
  100ms of a press and releases with the CSS ease.
  *(Guideline: Motion › brief and precise feedback.)*
- **Offscreen loops pause.** The hero console, orb drift, marquee, art loops, aura drift and timeline
  shine all pause when they're offscreen or the tab is hidden.
- **`will-change`.** It is set only while a tween runs, never in static CSS (the reference's
  `.jr-chip { will-change }` moves to runtime).

### 4. Materials & vibrancy

- **Purposeful glass.** It is kept exactly where the reference uses it: the functional layer (nav, menu,
  overlay bar) and the signature showcase surfaces (hero composition, journey band, rule cards, form).
  Ordinary content cards stay `--surface` or solid. *(Guideline: Materials › use materials to create
  separation, not decoration.)*
- **Blur in range.** Blur stays 10–24px with saturate 1.5–1.6, inside the 20–40px "regular" band for large
  glass. Glass opacity floors are raised where text sits on it (see contrast).
- **Cheaper orbs.** Orbs render as pre-softened `radial-gradient` discs instead of `filter: blur(72px)` on
  animated elements. They look identical and are far cheaper to composite. They only animate `transform`.
- **Reduce Transparency** (`prefers-reduced-transparency: reduce`, and forced colours):
  - Every `backdrop-filter` is removed.
  - Glass surfaces become solid. Light glass uses `--surface-solid`, coloured glass uses `--rc` at 100%,
    and the nav uses `--surface-solid` with a `--line-strong` border.
  - Orbs are hidden.

### 5. Hit targets (≥44×44)

| Element | Reference | Polish |
|---|---|---|
| Buttons / sm | 52 / 44 | unchanged |
| Icon btn / mini btn / menu btn | 48 / 44 / 46 | unchanged |
| Nav links, tabs, filters, crumb link, link-arrow | 44 | unchanged |
| TOC buttons | 42 | **44** |
| Project tag buttons (`rp-tag`) | ~28 visual | 28 visual, **44 hit area** via an inset −8px pseudo-element |
| Commit head, case row, next link | ≥56 | unchanged |
| Scroll cue / brand mark | 44 brand | unchanged |

There is at least 8px between adjacent targets. Chips are not interactive, so they are exempt.

### 6. Contrast (WCAG 2.2 AA, measured)

| Pair | Ratio | Result |
|---|---|---|
| muted on bg / bg-2 / white (light) | 5.01 / 4.70 / 5.59 | pass |
| body on bg (light) / dark | 8.56 / 11.24 | pass |
| accent-text on bg / on accent-soft | 6.05 / 5.36 | pass |
| white on accent (light / dark) | 4.91 / 4.56 | pass |
| on-deep-muted on deep | 9.13 | pass |
| muted on bg (dark) | 7.10 | pass |
| **ok-text on ok-soft** (Published / Current pill) | **4.27** | fail → `--ok-text` light goes `#0B7A43 → #08703C` (4.88) |
| **wend paragraph** (white .86 on accent) | **4.06** | fail → full white (4.91 light, 4.56 dark) |
| **white text on coloured glass** (cards 2, 4, 6 at the 66% end) | **2.46–3.87** | fail → see below |

**Coloured-glass fix.** The stained-glass look stays, but its translucency range shifts from 88% → 66%
to 94% → 82%. Paragraphs and proof copy go from 86–90% white to 100% white, and a soft 16% navy scrim
(a radial fade, so it has no visible edge) sits under the text column only. Measured worst case: card 6
(`#1670E0`) over the lightest orb goes from 2.46 to about 4.7, and card 2 to about 5.3. Target: ≥4.5:1
for 15–17px copy and ≥3:1 for the large titles. The visual change is small: the cards read slightly richer.

Every pair is re-checked in dark mode and on top of the orbs (axe plus a manual sampling script).
*(Guideline: Accessibility › 4.5:1 up to 17pt, 3:1 for 18pt+/bold.)*

### 7. Reduce Motion (`prefers-reduced-motion: reduce`)

- No loader. The shutter becomes an instant swap (focus still moves to the h1).
- No pins and no scrubs. The journey shows the 6-stage list; the work rail is a vertical stack.
- The timeline is fully lit, with all experience cards visible.
- The hero console shows one finished scenario (MoodVerse, `200 OK · 412 ms`).
- No cursor, magnetic or tilt effects.
- The marquee is static.
- Orbs and art loops are static.
- Flip changes become instant.
- The rotating word stays "systems".

### 8. Focus & keyboard

- **Focus ring.** `:focus-visible` uses a 2.5px accent outline with a 3px offset. On navy and on accent
  fills it switches to `--accent-on-deep` or white, so it is never invisible.
- **Skip link.** The first focusable element.
- **Focus after navigation.** Every navigation focuses the new page's `h1` (`tabindex=-1`, no outline on
  programmatic focus).
- **Project dialog.** It traps focus, closes on Esc, and returns focus to the card that opened it.

### 9. Appearance

- **Semantic tokens only.** Every component uses semantic tokens. Dark mode is a token swap, never a
  component fork.
- **Theme toggle.** System, light or dark. It is persisted, set before paint by an inline script, and
  appears in the nav (desktop) and the menu (mobile). It is ≥44px and labelled.

### 10. Writing

Sentence case everywhere, as in the reference. Labels are verbs ("Open project", "Copy email address").
Toasts confirm the result ("Email copied"). Never present invented numbers as real.

## Iteration guide

1. New component? Compose it from existing tokens, radii and shadows here first. If a value is
   missing, add it to the front matter, then use it.
2. New animation? Pick a curve from the Motion table, give it a reduced-motion end state, and pause
   it offscreen.
3. New colour? Don't. Use a status token or the accent pair.

## Known gaps

- iOS Safari `backdrop-filter` and `svh` behaviour can't be verified on this Windows machine. WebKit
  (Playwright) is the stand-in, and a real-device pass is listed in `TODO-ABEL.md`.
- The hero console metrics are illustrative by design until Abel supplies real measurements.
