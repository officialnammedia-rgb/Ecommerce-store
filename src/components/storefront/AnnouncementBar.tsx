"use client";

import { Truck, RotateCcw, ShieldCheck, BadgeIndianRupee } from "lucide-react";

const items = [
  { icon: Truck, text: "Free shipping over ₹999" },
  { icon: RotateCcw, text: "Easy 7-day returns" },
  { icon: BadgeIndianRupee, text: "Cash on delivery available" },
  { icon: ShieldCheck, text: "100% secure checkout" },
];

export function AnnouncementBar() {
  return (
    <div className="bg-neutral-900 text-white text-xs overflow-hidden">
      <div className="container py-2 flex items-center gap-8 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
        {[...items, ...items].map((it, i) => {
          const Icon = it.icon;
          return (
            <span key={i} className="flex items-center gap-2 shrink-0">
              <Icon className="h-3.5 w-3.5" /> {it.text}
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
