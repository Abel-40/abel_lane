/* eslint-disable @next/next/no-img-element -- pre-optimised WebP (kit files + derived widths); we pass our own srcset */
import type { CaseFigure } from "@/content/types";
import { MarkupIcon } from "@/components/ui/Icon";
import { imageSrcSet } from "@/content/image-variants";

/** Full-width case-study figure under the system flow; links to the 1800px file. The image keeps its own footnote. */
export function CaseFigureView({ figure, className = "" }: { figure: CaseFigure; className?: string }) {
  return (
    <figure className={`rd-fig ${className}`.trim()}>
      <a className="rd-fig-img" href={figure.src} target="_blank" rel="noopener noreferrer" aria-label="Open the figure full size">
        <img
          src={figure.srcSm}
          srcSet={imageSrcSet(figure)}
          sizes="(max-width: 1280px) 94vw, 1200px"
          width={1800}
          height={1125}
          alt={figure.alt}
          decoding="async"
        />
        <span className="rd-fig-zoom" aria-hidden="true">
          <MarkupIcon name="expand" />
        </span>
      </a>
      <figcaption>
        <span className="mono">{figure.label}</span>
        {figure.caption}
      </figcaption>
    </figure>
  );
}
