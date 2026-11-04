import type { Metadata } from "next";
import { NotFoundView } from "@/components/chrome/NotFoundView";
import { SiteDocument, siteMetadata, siteViewport } from "./(site)/site-document";

/* Unmatched URLs. The app has two root layouts ((site) and (mezgeb)), so the 404 renders the portfolio's
   document itself; it looks exactly like the old app/not-found.tsx inside the old root layout. */
export const metadata: Metadata = { ...siteMetadata, title: "Not found | Abel Addis", robots: { index: false } };
export const viewport = siteViewport;

export default function GlobalNotFound() {
  return (
    <SiteDocument>
      <NotFoundView />
    </SiteDocument>
  );
}
