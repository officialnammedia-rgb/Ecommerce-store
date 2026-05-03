"use client";

import { useEffect, useState } from "react";

// Polls the live-visitors endpoint every 20 seconds and shows a pulsing dot
// so the admin can see real-time activity on the store.
export function LiveVisitors({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/admin/stats/live", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { live?: number };
        if (!cancelled && typeof data.live === "number") {
          setCount(data.live);
          setUpdatedAt(new Date());
        }
      } catch {
        // ignore
      }
    }
    const id = window.setInterval(tick, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <p className="text-xs uppercase tracking-wide text-neutral-500">Live visitors</p>
      </div>
      <p className="mt-1 text-2xl font-semibold">{count}</p>
      <p className="mt-1 text-[11px] text-neutral-400">
        Last 5 min · updated {updatedAt.toLocaleTimeString()}
      </p>
    </div>
  );
}
