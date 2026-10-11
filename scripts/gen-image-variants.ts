/**
 * Derives 360/480/720w WebP variants from the images kit's 1800px files (public/images/{projects,cases}), so phones
 * and thumbnails don't download the 960px `-sm` file. Same pixels, only resized. Existing variants are skipped.
 *   pnpm gen:images [--force]
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { VARIANT_WIDTHS, variantPath } from "../src/content/image-variants";

const force = process.argv.includes("--force");
const dirs = ["projects", "cases"].map((d) => join(process.cwd(), "public/images", d));
const isSource = (f: string) => f.endsWith(".webp") && !/-(sm|\d+)\.webp$/.test(f);

async function main() {
  let made = 0;
  for (const dir of dirs) {
    for (const f of readdirSync(dir).filter(isSource)) {
      for (const w of VARIANT_WIDTHS) {
        const out = join(dir, variantPath(f, w));
        if (!force && existsSync(out)) continue;
        await sharp(join(dir, f)).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(out);
        made++;
      }
    }
  }
  console.log(`image variants: ${made} written`);
}

main();
