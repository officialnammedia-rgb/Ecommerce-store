import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

const FREE_SHIPPING_THRESHOLD = 99900; // paise (₹999)

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const eligible = remaining === 0;

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-neutral-700" />
        {eligible ? (
          <span className="font-semibold text-emerald-800">
            🎉 You&apos;ve unlocked free shipping!
          </span>
        ) : (
          <span>
            Add <strong>{formatINR(remaining)}</strong> more for{" "}
            <strong>free shipping</strong>
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            eligible ? "bg-emerald-500" : "bg-brand-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
