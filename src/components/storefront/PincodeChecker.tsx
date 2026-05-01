"use client";

import { useState } from "react";
import { Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryEstimate = {
  pincode: string;
  ok: boolean;
  message: string;
  etaDays?: [number, number];
  cod?: boolean;
};

// Lightweight, deterministic estimator. Replace with real courier serviceability API later.
function estimate(pincode: string): DeliveryEstimate {
  if (!/^\d{6}$/.test(pincode)) {
    return { pincode, ok: false, message: "Enter a valid 6-digit Indian pincode" };
  }
  const first = pincode[0];
  const lastTwo = parseInt(pincode.slice(-2), 10);

  // Metro shortcuts: Mumbai 400xxx, Delhi 110xxx, Bangalore 560xxx, Chennai 600xxx, Kolkata 700xxx, Hyderabad 500xxx
  const metro = ["400", "110", "560", "600", "700", "500"].some((p) =>
    pincode.startsWith(p),
  );

  if (metro) {
    return {
      pincode,
      ok: true,
      message: "Free shipping · Delivery in 2–4 business days",
      etaDays: [2, 4],
      cod: lastTwo % 7 !== 0, // ~85% pincodes — toy heuristic
    };
  }

  // Rough buckets by leading digit
  const buckets: Record<string, [number, number]> = {
    "1": [3, 6],
    "2": [3, 6],
    "3": [4, 7],
    "4": [3, 5],
    "5": [3, 6],
    "6": [3, 5],
    "7": [4, 7],
    "8": [5, 8],
    "9": [4, 7],
    "0": [5, 8],
  };
  const [lo, hi] = buckets[first] ?? [4, 7];
  return {
    pincode,
    ok: true,
    message: `Delivery in ${lo}–${hi} business days`,
    etaDays: [lo, hi],
    cod: lastTwo % 7 !== 0,
  };
}

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryEstimate | null>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    setResult(estimate(pincode.trim()));
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4" />
        Check delivery
      </div>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter pincode"
            className="w-full h-10 rounded-md border border-neutral-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          />
        </div>
        <button
          type="submit"
          disabled={pincode.length !== 6}
          className="h-10 rounded-md bg-neutral-900 text-white px-4 text-xs font-semibold uppercase tracking-wider disabled:opacity-40"
        >
          Check
        </button>
      </form>
      {result && (
        <div
          className={cn(
            "mt-3 text-sm rounded-md px-3 py-2",
            result.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900",
          )}
        >
          <p className="font-medium">{result.ok ? `📦 ${result.pincode}` : "Invalid pincode"}</p>
          <p className="text-xs mt-0.5">{result.message}</p>
          {result.ok && (
            <p className="text-xs mt-0.5">
              {result.cod ? "Cash on delivery available" : "Cash on delivery not available — prepaid only"}
            </p>
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] text-neutral-500">
        Free shipping on prepaid orders above ₹999.
      </p>
    </div>
  );
}
