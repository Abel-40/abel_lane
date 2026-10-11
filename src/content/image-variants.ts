/** Widths derived from each kit image by scripts/gen-image-variants.ts, next to the kit's own 960w and 1800w files. */
export const VARIANT_WIDTHS = [360, 480, 720] as const;

export const variantPath = (src: string, w: number) => src.replace(/\.webp$/, `-${w}.webp`);

/** Full srcset for a kit image: derived variants, then the kit's `-sm` (960w) and full (1800w) files. */
export const imageSrcSet = ({ src, srcSm }: { src: string; srcSm: string }) =>
  [...VARIANT_WIDTHS.map((w) => `${variantPath(src, w)} ${w}w`), `${srcSm} 960w`, `${src} 1800w`].join(", ");
