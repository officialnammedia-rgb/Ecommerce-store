"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-6 bg-neutral-50">
          <div className="max-w-md text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-accent">
              Something went wrong
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
              We hit a snag loading this page.
            </h1>
            <p className="mt-3 text-neutral-600 text-sm">
              The error has been logged. You can try again, or head back to the homepage.
            </p>
            {error.digest && (
              <p className="mt-2 text-[11px] text-neutral-400 font-mono">
                Reference: {error.digest}
              </p>
            )}
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
