"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useTransitionRouter } from "./TransitionProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * next/link that plays the route shutter. Prefetching is kept; `onNavigate` only fires for same-origin
 * client navigations, so Ctrl/Cmd-click and middle-click still open a new tab.
 */
export function TransitionLink({ href, onNavigate, ...rest }: Props) {
  const { navigate } = useTransitionRouter();
  return (
    <Link
      href={href}
      {...rest}
      onNavigate={(e) => {
        onNavigate?.(e);
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}
