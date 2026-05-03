"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Pings /api/visit once per path change so we can show live + monthly visitor
// counts on the admin dashboard. Purposefully fire-and-forget.
export function VisitorPing() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Don't track admin or auth callback pages.
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const controller = new AbortController();
    fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // swallow network errors — analytics must never break navigation
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
