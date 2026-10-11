"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { setOverlaySource } from "@/lib/overlay";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  slug: string;
  /** Closest ancestor the overlay should expand from. */
  from?: string;
};

/** Link to /projects/[slug]. Soft navigations are intercepted into the overlay, which expands from the card. */
export function ProjectLink({ slug, from = ".wcard, .pcard", onClick, ...rest }: Props) {
  return (
    <Link
      href={`/projects/${slug}`}
      scroll={false}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        const t = e.currentTarget as HTMLElement;
        setOverlaySource((t.closest(from) as HTMLElement | null) ?? t);
      }}
    />
  );
}
