import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Providers } from "@/components/Providers";
import { CookieConsent } from "@/components/site/CookieConsent";
import { VisitorPing } from "@/components/site/VisitorPing";

export const metadata: Metadata = {
  title: {
    default: process.env.STORE_NAME ?? "Ascendyl",
    template: `%s | ${process.env.STORE_NAME ?? "Ascendyl"}`,
  },
  description: "Modern clothing store",
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
        </Providers>
      </body>
    </html>
  );
}
