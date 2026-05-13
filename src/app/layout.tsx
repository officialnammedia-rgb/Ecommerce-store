import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/site/CookieConsent";
import { VisitorPing } from "@/components/site/VisitorPing";
import { GoogleAnalytics } from "@/components/site/GoogleAnalytics";
import { siteName, siteUrl, SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/site";

const NAME = siteName();
const ORIGIN = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: {
    default: `${NAME} — Modern everyday clothing`,
    template: `%s | ${NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: NAME,
  authors: [{ name: NAME }],
  creator: NAME,
  publisher: NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: NAME,
    title: `${NAME} — Modern everyday clothing`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${NAME} storefront`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${NAME} — Modern everyday clothing`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  // No explicit icons entry needed — Next.js auto-wires app/icon.tsx and
  // app/apple-icon.tsx as the site's favicon + apple-touch-icon.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: { telephone: true, address: false, email: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
          <VisitorPing />
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  );
}
