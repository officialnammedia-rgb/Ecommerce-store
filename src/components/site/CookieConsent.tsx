"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "ascendyl_cookie_consent_v1";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (!v) {
        // Defer slightly so the banner doesn't flash before the page paints.
        const t = window.setTimeout(() => setShow(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — quietly skip.
    }
  }, []);

  function persist(value: "accepted" | "essential") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* noop */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-50 rounded-lg border border-neutral-200 bg-white shadow-xl p-4"
    >
      <button
        type="button"
        onClick={() => persist("essential")}
        aria-label="Dismiss"
        className="absolute top-2 right-2 p-1 rounded hover:bg-neutral-100 text-neutral-500"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-sm font-semibold pr-6">We use cookies</p>
      <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
        We use essential cookies to keep your cart and account working, and optional cookies
        to understand how shoppers use the site. You can read details in our{" "}
        <Link href="/pages/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => persist("accepted")}
          className="flex-1 h-9 rounded-md bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => persist("essential")}
          className="flex-1 h-9 rounded-md border border-neutral-300 text-xs font-semibold hover:bg-neutral-50"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
