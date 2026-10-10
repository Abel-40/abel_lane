# Abel Addis portfolio — build kit

Everything Claude Code needs to rebuild the portfolio as a production Next.js app. The goal is an exact match to the reference, and better where it can be.

## What's inside

```
abel-portfolio-build-kit/
├── PROMPT.md              ← the build prompt for Claude Code
├── README.md              ← this file
└── reference/
    ├── index.html         ← the working site (open in a browser; needs internet for GSAP, Lenis and fonts)
    ├── abel.webp          ← photo, used once on the About page
    ├── content.json       ← all structured content: projects, case studies, experience, stack, principles, journey, hero console
    ├── tokens.css         ← colour and material tokens (light, system dark, forced dark)
    ├── icons.json         ← UI icons, generic tool icons and brand logos with brand colours
    └── screenshots/       ← 33 reference captures
                             d* = desktop light, k* = desktop dark, m* = mobile
```

## How to use it

1. **Unzip** into an empty folder, for example `~/code/abel-portfolio`.
2. **Check the skills are installed in Claude Code.** The prompt calls `/awesome-design-md` and `/apple-design`. If one is missing, Claude Code will say so and continue without it.
3. **Open Claude Code in that folder** and type:

   > Read PROMPT.md and follow it exactly.

   It plans first (`PLAN.md`, `PARITY.md`) and shows you the plan before it builds.

To see the reference yourself, open `reference/index.html` in a browser, or run `npx serve reference`.

## Things only you can provide

Claude Code will also list these in `TODO-ABEL.md`:

- **Résumé PDF.** Save it as `public/resume.pdf`.
- **Unwritten case-study sections.** The reference shows them as `[ placeholders ]`.
- **Resend API key.** `RESEND_API_KEY` lets the contact form send real email. Without it, the form falls back to copying the message.
- **Optional: real metrics.** The hero console uses illustrative numbers under a "sample request" label. Real measurements from your projects can replace them.
