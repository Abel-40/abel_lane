import type { Metadata, Viewport } from "next";
import { Cursor } from "@/components/chrome/Cursor";
import { Footer } from "@/components/chrome/Footer";
import { Loader } from "@/components/chrome/Loader";
import { Nav } from "@/components/chrome/Nav";
import { ScrollRefresh } from "@/components/chrome/ScrollRefresh";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Toast } from "@/components/chrome/Toast";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { site } from "@/content/site";
import { JsonLd, siteJsonLd, siteUrl } from "@/lib/seo";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.title, template: "%s | Abel Addis" },
  description: site.description,
  applicationName: "Abel Addis",
  authors: [{ name: site.name, url: siteUrl() }],
  creator: site.name,
  openGraph: { type: "website", siteName: "Abel Addis", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  // Search Console / Bing Webmaster verification codes (data/site.json › verification); empty values are skipped
  verification: {
    ...(site.verification.google ? { google: site.verification.google } : {}),
    ...(site.verification.bing ? { other: { "msvalidate.01": site.verification.bing } } : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDF3FC" },
    { media: "(prefers-color-scheme: dark)", color: "#060D1F" },
  ],
};

/* Runs before first paint: applies the saved theme and decides whether the loader runs this session. */
const prePaint = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("abel-theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}try{if(sessionStorage.getItem("abel-loader-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches)d.setAttribute("data-loader","off")}catch(e){d.setAttribute("data-loader","off")}})();`;

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <TransitionProvider>
          <Loader />
          <Cursor />
          <Nav />
          <div id="main" tabIndex={-1}>
            {children}
          </div>
          <Footer />
          {modal}
          <Toast />
        </TransitionProvider>
        <JsonLd data={siteJsonLd()} />
        <SmoothScroll />
        <ScrollRefresh />
      </body>
    </html>
  );
}
