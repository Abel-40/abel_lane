# PARITY.md — reference → build checklist

How to read it:

- ☐ is not done yet; ☑ means it matches the reference and has been checked against the screenshot.
- Numbering follows PROMPT §5.
- Timings in [brackets] are the reference values.
- Deliberate deviations are listed at the bottom with the reason for each.

## 5.1 Global

- ☐ 5.1.1a Loader: a navy screen whose terminal log types in line by line (`$ abel serve --env production`, then `✓` FastAPI services up, Celery workers ready, pgvector index loaded, Listening)
- ☐ 5.1.1b Loader: a `000→100` counter and progress bar [1.3s power2.inOut]
- ☐ 5.1.1c Loader: the content lifts away [.4s at 1.4s], then the top and bottom panels split [expo.inOut .85s at 1.62s]
- ☐ 5.1.1d Loader: a click speeds it ×4
- ☐ 5.1.1e Loader (improvement): it shows once per session, has a visible Skip button, and Esc or any key also skips
- ☐ 5.1.2a Shutter: four vertical bars (accent, accent-deep, deep-2, deep) sweep up [power4.inOut .62s, stagger .055]
- ☐ 5.1.2b Shutter: a centred label `GET /path` [.3s power3.out], then `200 OK` pops in [.12s after .12s]
- ☐ 5.1.2c Shutter: the page swaps underneath, then the label exits and the bars exit upward [.68s power4.inOut]
- ☐ 5.1.2d Shutter labels: `/`, `/about`, `/projects`, `/case-studies`, `/contact`, plus the 404 label `GET /… 404`
- ☐ 5.1.2e Shutter: a shorter version on back and forward; focus moves to the new `h1` after every navigation
- ☐ 5.1.3a Nav: a floating frosted pill (nav-bg, blur 18 saturate 160%, 22px radius, glass-edge border)
- ☐ 5.1.3b Brand mark: the "AB" in Great Vibes on a blue→cyan rounded square; its strokes draw in after the loader, then fill
- ☐ 5.1.3c Brand mark hover: tilts −8°, scales 1.04 and a sheen sweeps across; the wordmark reads "Abel *Addis*" (Instrument Serif italic)
- ☐ 5.1.3d Links: a centred tray with a white pill sliding under the active or hovered link
- ☐ 5.1.3e Right side: an "Open to remote work" chip with a pulsing dot (hidden under 1100px), and a magnetic "Let's talk" accent button
- ☐ 5.1.3f Hide and show: hides on scroll-down past 260px, shows on scroll-up, and is force-hidden while the journey is pinned
- ☐ 5.1.3g Mobile: a hamburger opens a full-screen navy menu (circle clip from the top-right [.75s]) with huge links, route hints, the availability chip and the email
- ☐ 5.1.4 Scroll progress bar at the top (3px accent→accent-2, scaleX)
- ☐ 5.1.5 Custom cursor (fine pointers): a ring following the pointer [quickTo .35s]; it grows over links and buttons, shows a label for `data-cursor` ("Open", "Read"), and hides on touch and when the mouse leaves the window
- ☐ 5.1.6 Magnetic buttons: follow the pointer ×.3 / ×.35 and spring back [elastic.out(1,.45) .6s]
- ☐ 5.1.7a Copy email: copies and shows the toast "Email copied: …", with a select-text fallback
- ☐ 5.1.7b Live Addis Ababa clock (`Africa/Addis_Ababa`, 24h); client-only, appearing in the hero pill, CTA meta and contact list
- ☐ 5.1.7c `rise` reveal [y 46→0, fade, power3.out 1s, stagger .08, `top 86%`]
- ☐ 5.1.7d SplitText character and word reveals for headings
- ☐ 5.1.7e Scramble/decode text effect [1.8s power2.inOut]
- ☐ 5.1.8 Themes: light and dark follow the system, `[data-theme]` forces one, and glass has dark token sets

## 5.2 Home

- ☐ 5.2.1a Hero layout: two columns on desktop, stacked on mobile; `min-height: clamp(700px,100svh,980px)`
- ☐ 5.2.1b Kicker pill with a pulse dot: "Backend engineer, AI systems · Ethiopia (UTC+3)"
- ☐ 5.2.1c H1 in three lines, "I build the / [word] / behind AI products.", with the characters rising in [power4.out 1.1s, stagger .02]
- ☐ 5.2.1d Rotating word systems→APIs→workers→pipelines→retrieval: the old word slides up and out, the new one slides up and in, the width animates, and a cyan caret blinks
- ☐ 5.2.1e Lead paragraph, "See the work" (scrolls to #work) and "Get in touch" buttons
- ☐ 5.2.1f Credentials row: Andela · AWS Certified · BSc Software Engineering · 2+ years
- ☐ 5.2.1g Glass composition with blurred blue, cyan and indigo orbs drifting behind it
- ☐ 5.2.1h Console card: bar reads "sample request", plus the project chip, `POST /v1/...` and a status pill (`··· pending` → `200 OK · N ms`)
- ☐ 5.2.1i Console replay of the 4 `heroConsole` scenarios: it types the request, grows 3 trace bars, prints the syntax-coloured response, flips the status and waits 2.8s
- ☐ 5.2.1j p95 latency card: the number tweens to each scenario's value and the gradient sparkline shifts
- ☐ 5.2.1k Celery workers card: 3 looping job bars, with the "N done" counter going up each loop
- ☐ 5.2.1l Local-time pill: the clock plus "Addis Ababa · open to remote"
- ☐ 5.2.1m Logo chips: FastAPI, PostgreSQL, Redis, Celery and Gemini in brand colours on glass
- ☐ 5.2.1n Intro: the console rises, the metric and queue cards fly in rotated [back.out(1.5)], and the chips pop in staggered
- ☐ 5.2.1o Motion: pointer parallax by depth, 3D stage tilt, slow bobbing, and cards drifting apart on scroll
- ☐ 5.2.1p Mobile: only the console, the metric card and the time pill
- ☐ 5.2.1q Honesty: the console stays labelled "sample request"
- ☐ 5.2.1r "Scroll" cue bottom-right
- ☐ 5.2.2a Marquee: two rows of tech names (the second outlined) running in opposite directions forever [42s]
- ☐ 5.2.2b Marquee velocity: speeds up to ×7, flips direction with the scroll and skews ±12°, then settles
- ☐ 5.2.3 Statement (01): each word goes from opacity .13 to 1 on scrub [`top 82%`→`bottom 48%`, scrub .4]; signature line underneath
- ☐ 5.2.4a Journey (02) desktop: pinned for 2.8 viewport heights [scrub .6] inside the full-screen frosted cyan glass band
- ☐ 5.2.4b Journey band: glass gradient, `#0E8FD0` 24% and `#5ED0FF` 14% tints, cyan and indigo auras, and scale .93→1 with radius 60→34 on entry
- ☐ 5.2.4c Journey left panel: `POST /v1/ask` plus a state chip, an `NN / 06` counter, title, description and tech chip
- ☐ 5.2.4d Journey left panel: a dark "Example payload" block that types in, plus the progress meter; the text transitions out and in per stage
- ☐ 5.2.4e Journey step chips 1–6 (done, now, future)
- ☐ 5.2.4f Journey SVG diagram (640×400): User → API (dashed async link to the Job queue) → two lanes (PostgreSQL, Vector DB) → merge → Knowledge → AI model → Response
- ☐ 5.2.4g Journey on scroll: paths draw, a glowing packet with trail and halo travels the route, a second packet rides lane B, junctions light up, and nodes light up with the current one glowing and ring-bursting
- ☐ 5.2.4h Data tag: an ink pill (icon + label) rides above the packet, going JSON → query → SQL/embed → rows/top-k → results → context → tokens → 200 OK; it shrinks inside nodes and pops on a new label, and the lane-B tag fades out before the merge
- ☐ 5.2.4i Journey mobile: a vertical numbered list of the six stages
- ☐ 5.2.5a Work (03) header: "Selected work", subtitle, and an `01 / 04` counter with progress bar
- ☐ 5.2.5b Work desktop: a pinned horizontal rail of the first 4 projects plus the end card ("That's the highlight reel." with an "All projects" button)
- ☐ 5.2.5c Work: the counter follows the card nearest the centre; cards scale .9→1 and rotate 2°→0° on entry; the art parallaxes ±4%
- ☐ 5.2.5d Work tones: card 2 deep navy, card 4 tinted
- ☐ 5.2.5e Work: "Open project" opens the detail, expanding from the card
- ☐ 5.2.5f Work mobile: a vertical stack
- ☐ 5.2.6a Experience (04) "Where I've shipped.": a winding SVG timeline down the centre, alternating cards (max 430px) that overlap in a zig-zag
- ☐ 5.2.6b Experience years: outlined on the opposite side ("Now", "2025–26", "2025", "2023"), filling with the accent gradient when lit
- ☐ 5.2.6c Experience scroll: the line draws, a white head dot with a pulsing halo travels it, each dot lights, its connector draws and a ring bursts
- ☐ 5.2.6d Experience cards appear only when the head reaches their dot (slide from the spine, contents staggered) and hide again on scroll-up
- ☐ 5.2.6e Experience mobile: the spine runs down the left with a small wiggle
- ☐ 5.2.7a How I build (05): six sticky stacked glass cards (top = 100 + 18px·i)
- ☐ 5.2.7b Card fills alternate: light tinted glass (1, 3, 5) and coloured glass (2, 4, 6) with per-card hues
- ☐ 5.2.7c Card layout: index pill `01 / 06`, gradient line and icon tile; title and description; a "Where it shows up" proof panel with project tag buttons (Andela → /about); and a huge outlined watermark number that parallaxes
- ☐ 5.2.7d Stacking: the previous card scales to .92 and fades toward the bg as the next arrives; cards rotate ±2.5° and rise in
- ☐ 5.2.7e Coloured orbs drift behind the stack on scroll
- ☐ 5.2.8a Deep dive (06): a navy band with grid and glow, label "Case study 01, MoodVerse", and the band clip-reveal on scroll
- ☐ 5.2.8b Deep dive: the question decodes in with the scramble effect, followed by the answer, "Read the case study" and "All case studies"
- ☐ 5.2.8c Deep dive: a "More write-ups" list with statuses and hover arrows
- ☐ 5.2.9a CTA (07): "Hiring for a backend or AI role?" with words rising, the lead, and a large round magnetic "Let's talk" ball [elastic.out(1,.5) 1.2s, rotation −90, scale .4]
- ☐ 5.2.9b CTA meta: "It's HH:MM in Addis Ababa", the email and a copy button

## 5.3 About

- ☐ 5.3.1a Hero text: split-character H1 "From UI/UX to the systems behind products.", two leads, and "Résumé" and "Get in touch" buttons
- ☐ 5.3.1b Photo (only here): clip reveal `inset(100% 0 0 0 round 32px)`→`inset(0)` [expo.inOut 1.3s] with the image scaling 1.25→1
- ☐ 5.3.1c Photo: the name tag slides in and the "Freelancing, open to remote" chip pops in
- ☐ 5.3.1d Photo: pointer 3D tilt (rotateY ±6°, rotateX ±5°) and a slight scroll parallax
- ☐ 5.3.2 Facts row: "2+" counts up from 0, then Andela, AWS and UTC+3
- ☐ 5.3.3a Career log: a terminal card (`~/abel`) that types `$ git log --career`
- ☐ 5.3.3b Career log: commits (period, label, org) expand to show bullets; the head entry is marked `HEAD → main`; Andela is open by default
- ☐ 5.3.3c Career log: the vertical rail fills on scroll with a travelling head dot, and commits light up as they're passed
- ☐ 5.3.4a Tools: count ("N tools across 6 areas"), All plus 6 category tabs with a sliding pill
- ☐ 5.3.4b Tools board: compact cards (36px brand logo tile, name, group label); tab changes animate with Flip; cursor spotlight; cards pop in with back easing
- ☐ 5.3.5 Education: BSc Software Engineering (Arba Minch University, June 2026) and AWS Certified Cloud Practitioner
- ☐ 5.3.6 Next link: a large "See the projects →"

## 5.4 Projects

- ☐ 5.4.1 Hero: "Five products, each built around a real problem."
- ☐ 5.4.2 Filters: All · AI and retrieval · Async and data · Full-stack · Mobile, with a sliding pill, `aria-pressed`, "Showing N of 5" and a Flip re-flow
- ☐ 5.4.3a Project card: art, tagline, status pill, name, hook, chips, "View project →" and kind label
- ☐ 5.4.3b Project card: 3D tilt and a lift on hover, and a batch rise-in on scroll
- ☐ 5.4.4a Detail: a modal from the list or Home, a full page on direct visits; opens by expanding from the clicked card, then the sections rise in
- ☐ 5.4.4b Detail top bar: breadcrumb "‹ projects / slug" (projects is clickable), prev, next and close; Esc closes; focus is trapped
- ☐ 5.4.4c Detail hero: status pill, role chip and tags, giant name, tagline and art panel
- ☐ 5.4.4d Detail sections: The problem · The product · Key capabilities · How it flows · Tech stack · actions (Read the case study / GitHub) · Next project
- ☐ 5.4.5a Art "insight" (feed cards, bar chart, trend line) in light and dark
- ☐ 5.4.5b Art "mood" (chat bubble, chips, arrow, sparkle, bookmarked passage card, check) in light and dark
- ☐ 5.4.5c Art "seo" (scan line, site tree, check and warn badges, progress) in light and dark
- ☐ 5.4.5d Art "alert" (chart, threshold, ABOVE tag, ring, dropping notification) in light and dark
- ☐ 5.4.5e Art "work" (kanban columns, floating accent card, AI chip, lock) in light and dark

## 5.5 Case studies

- ☐ 5.5.1 Hero: "The decisions behind the code.", a five-part step strip with a connecting line drawing across [1.3s] and steps rising in staggered
- ☐ 5.5.2a Rows: number, title, summary, project, status pill (Published / In writing / Planned) and arrow
- ☐ 5.5.2b Rows: hovering shows a floating, slightly rotated (−3°) art preview that follows the cursor
- ☐ 5.5.3a Reader: back link, tags/meta, split title and lede ("The engineering question")
- ☐ 5.5.3b Reader: a "System flow" strip
- ☐ 5.5.3c Reader: a sticky TOC with scroll-spy plus the body sections
- ☐ 5.5.3d Reader: unwritten sections show bracketed placeholders, visibly marked TODO, never filled in; unwritten studies show the outline and "See the project"

## 5.6 Contact

- ☐ 5.6.1a Left: kicker, H1 "Let's build something reliable.", lead
- ☐ 5.6.1b Left list: Email (with copy), GitHub `github.com/Abel-40`, LinkedIn `linkedin.com/in/abel-addis`, Local time (UTC+3); "Open to" chips
- ☐ 5.6.2a Glass form card: floating labels for name, email, topic (select) and message
- ☐ 5.6.2b Validation: an inline message and a small elastic shake [elastic.out(1,.3) .5s]
- ☐ 5.6.2c Submit: the button shrinks into a circular spinner, then a success panel with an animated check draws in
- ☐ 5.6.2d Sending: real email via Resend (improvement), falling back to the reference compose-and-copy plus mailto

## 5.7 Footer

- ☐ 5.7a Bio line; icon buttons (copy email, GitHub, LinkedIn); "Back to top"
- ☐ 5.7b A giant "Abel Addis" whose letters rise one by one as the footer scrolls in (scrub)
- ☐ 5.7c Bottom row: "© 2026 Abel Addis · Backend Engineer, AI Systems"

## 5.8 Reduced motion and fallbacks

- ☐ 5.8a No loader
- ☐ 5.8b Shutter replaced with an instant swap
- ☐ 5.8c No pins or scrub (journey list, vertical work stack)
- ☐ 5.8d Timeline fully lit and all experience cards visible
- ☐ 5.8e Console shows one finished scenario
- ☐ 5.8f No cursor or magnetic effects (and no tilt)
- ☐ 5.8g Marquee static
- ☐ 5.8h Every animated element has a complete static state without JS (SSR markup is final-state)

---

## Deliberate deviations (planned; confirmed or refined in phase 9)

| # | Item | Reference | Build | Reason |
|---|---|---|---|---|
| D1 | Routing | hash routes (`#about`) | real routes | PROMPT §3 |
| D2 | Loader | every load | once per session, skippable | PROMPT 5.1.1 improvement; Apple "let people cancel motion" |
| D3 | Shutter during busy | second click ignored | latest target queued | never drop input |
| D4 | Back/forward | full shutter (hashchange) | single fast sweep (~.45s) | PROMPT §3 "shorter version" |
| D5 | Overlay close on browser back | n/a (no URL) | instant close | intercepted route unmounts before an exit tween can run |
| D6 | `--ok-text` (light) | #0B7A43 (4.27:1 on pill) | #08703C (4.88:1) | WCAG AA |
| D7 | Work end-card paragraph | white @ .86 (4.06:1) | white @ .95 (4.58:1) | WCAG AA |
| D8 | Coloured glass cards 2/4/6 | 88%→66% hue, 86–90% white copy (2.46–3.87:1) | 94%→82% hue, 100% white copy, soft 16% navy scrim under text (~4.7:1 worst) | WCAG AA; look kept |
| D9 | 10–10.5px labels | tool group, mobile tool, data tag | 11px | legibility minimum |
| D10 | TOC button height | 42px | 44px | hit target |
| D11 | Project tag buttons | ~28px tall hit area | 44px hit area (visual unchanged) | hit target |
| D12 | Orbs | `filter: blur()` on animated divs | radial-gradient discs, transform-only | scroll performance; visually equivalent |
| D13 | Press feedback | none | `:active` scale .97 (100ms) | feedback within 100ms |
| D14 | Résumé button | toast "not connected" | links `/resume.pdf` if present, otherwise hidden | PROMPT §7.4 |
| D15 | Glass | always | solid under `prefers-reduced-transparency` | PROMPT §7.7 |
