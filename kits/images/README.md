# Abel Addis portfolio: images add-on kit

This kit is an add-on to the first build kit and doesn't restart the build. It brings real project screens and case-study figures into the site Claude Code is already building.

## Contents

- `public/images/projects/`: 20 project screens. There are 4 per project, as 1800×1125 WebP files plus a 960×600 `-sm` version of each.
- `public/images/cases/`: 5 case-study figures, one per case study, in the same two sizes.
- `data/`: JSON to merge into `content.json`. It holds labels, captions, alt text, light/dark tags, the two cover screens for each project, and the project colours.
- `PROMPT.md`: the instructions for Claude Code.
- `reference/`: the working reference page, CSS/JS excerpts and 18 screenshots of the finished result.

## Use

1. Unzip this kit inside your project repo, for example to `kits/images/`.
2. In Claude Code, say: **"Read kits/images/PROMPT.md and follow it."**

## Preview the reference

Run the following from this folder, then open `http://localhost:3000/reference/`:

```
npx serve .
```

Serve from this folder, not from `reference/`. The page loads its images from `../public/images/`.

## Where the images go

| Page | What shows |
|---|---|
| Home → Selected work | A stacked pair of screens on each card, with scroll parallax |
| Projects grid | A stacked pair on each card, which lifts on hover |
| Project detail | The pair in the hero, plus a new "Inside the product" gallery with all 4 screens |
| Case Studies list | The case figure appears as a floating preview on hover |
| Each case study | One full-width figure under the system flow |
