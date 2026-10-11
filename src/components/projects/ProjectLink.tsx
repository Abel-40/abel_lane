"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { setOverlaySource, startArtMorph } from "@/lib/overlay";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  slug: string;
  /** Closest ancestor the overlay should expand from. */
  from?: string;
};

/**
 * Link to /projects/[slug]. Soft navigations are intercepted into the overlay, which expands from the card;
 * where the View Transitions API exists, the card's art also morphs into the overlay's art panel.
 */
export function ProjectLink({ slug, from = ".wcard, .pcard", onClick, ...rest }: Props) {
  const router = useRouter();
  const href = `/projects/${slug}`;
  return (
    <Link
      href={href}
      scroll={false}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const t = e.currentTarget as HTMLElement;
        const card = (t.closest(from) as HTMLElement | null) ?? t;
        setOverlaySource(card);
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (startArtMorph(card, () => router.push(href, { scroll: false }))) e.preventDefault();
      }}
    />
  );
}
