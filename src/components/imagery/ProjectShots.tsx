/* eslint-disable @next/next/no-img-element -- pre-optimised WebP (kit files + derived widths); we pass our own srcset */
import type { Project, Shot } from "@/content/types";
import { imageSrcSet } from "@/content/image-variants";

/**
 * `sizes` per placement, measured from the layout (a screen is ~66vw while the composition is stacked; the grid
 * goes 1 → 2 → 3 columns at ~820 / ~1200px). The kit's 70vw / 760px values overshot by one srcset step on phones.
 */
export const SHOT_SIZES = {
  rail: "(max-width: 899.98px) 66vw, 460px",
  grid: "(max-width: 820px) 66vw, (max-width: 1200px) 34vw, 300px",
  hero: "(max-width: 899.98px) 66vw, 460px",
} as const;

function ShotImg({ sh, className, sizes, eager }: { sh: Shot; className: string; sizes: string; eager?: boolean }) {
  return (
    <img
      className={className}
      src={sh.srcSm}
      srcSet={imageSrcSet(sh)}
      sizes={sizes}
      width={960}
      height={600}
      alt={sh.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}

/**
 * The stacked pair: `shots[cover.back]` top-right bleeding off the edge, `shots[cover.front]` bottom-left over it,
 * on a panel tinted with the project's two hues. Position per placement comes from CSS (.wc-art / .pc-art / .po-art).
 */
export function ProjectShots({
  p,
  sizes,
  eager = false,
}: {
  p: Pick<Project, "hue" | "cover" | "shots">;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <span className="shots" style={{ "--h1": p.hue[0], "--h2": p.hue[1] } as React.CSSProperties}>
      <ShotImg sh={p.shots[p.cover.back]} className="sh sh-b" sizes={sizes} eager={eager} />
      <ShotImg sh={p.shots[p.cover.front]} className="sh sh-f" sizes={sizes} eager={eager} />
    </span>
  );
}
