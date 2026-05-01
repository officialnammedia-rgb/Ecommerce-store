import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number; // 0..5, can be fractional
  size?: number;
  className?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("flex items-center text-amber-500", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {stars.map((s) => {
        const fillPct = Math.max(0, Math.min(1, value - (s - 1))) * 100;
        return (
          <span key={s} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-neutral-300"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPct}%`, height: size }}
            >
              <Star
                className="text-amber-500 fill-current"
                style={{ width: size, height: size }}
                strokeWidth={1.5}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
