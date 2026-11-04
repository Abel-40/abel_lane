import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ServiceWorker } from "@/mezgeb/components/ServiceWorker";
import { ThemeSync } from "@/mezgeb/components/Theme";
import { THEME_BOOT_SCRIPT } from "@/mezgeb/lib/theme";
import "@/mezgeb/styles/mezgeb.css";

// Mezgeb's own root layout: none of the portfolio's fonts, styles, navbar or
// page transitions load here, and nothing here loads on the portfolio.

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--mz-font-display",
  display: "swap",
});

const text = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--mz-font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mezgeb",
  applicationName: "Mezgeb",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/mezgeb/manifest.webmanifest",
  // The portfolio's app/opengraph-image.tsx applies to every route; private pages carry no social card
  openGraph: null,
  twitter: null,
  icons: {
    icon: [{ url: "/mezgeb/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/mezgeb/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Mezgeb", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E1311",
  colorScheme: "dark light",
};

export default function MezgebRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // the boot script sets data-mz-theme (light / dark) before React hydrates
    <html lang="en" className={`${display.variable} ${text.variable}`} data-mz-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="mz">
        {children}
        <ServiceWorker />
        <ThemeSync />
      </body>
    </html>
  );
}
