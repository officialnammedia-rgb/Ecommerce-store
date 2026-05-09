"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * GA4 loader.
 *
 * - Only loads when NEXT_PUBLIC_GA_ID is set (so dev/preview without a key
 *   stays clean).
 * - Respects the cookie consent banner: stays disabled until the visitor picks
 *   "Accept all". The CookieConsent component dispatches an `ascendyl:consent`
 *   event whenever the choice changes; we listen for it.
 * - Manually fires `page_view` on client-side route changes (Next App Router
 *   doesn't trigger them automatically because there's no full page reload).
 */

const CONSENT_KEY = "ascendyl_cookie_consent_v1";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const id = measurementId ?? process.env.NEXT_PUBLIC_GA_ID;
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setEnabled(readConsent());
    function onConsent() {
      setEnabled(readConsent());
    }
    window.addEventListener("ascendyl:consent", onConsent);
    // Also react to changes from another tab.
    window.addEventListener("storage", onConsent);
    return () => {
      window.removeEventListener("ascendyl:consent", onConsent);
      window.removeEventListener("storage", onConsent);
    };
  }, []);

  // Manual page_view tracking for SPA navigations. We rely on `pathname`
  // changing to re-run; query strings within the same path are not tracked
  // separately (good enough for storefront analytics and avoids double-counts).
  useEffect(() => {
    if (!enabled || !id || typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;
    const search = window.location.search;
    const url = pathname + (search || "");
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [enabled, id, pathname]);

  if (!id || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true, send_page_view: false });
        `}
      </Script>
    </>
  );
}
