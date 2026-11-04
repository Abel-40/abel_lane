import { SiteDocument, siteMetadata, siteViewport } from "./site-document";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function SiteRootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return <SiteDocument modal={modal}>{children}</SiteDocument>;
}
