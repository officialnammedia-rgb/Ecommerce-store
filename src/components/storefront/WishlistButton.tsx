"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialFavorited,
  variant = "inline",
}: {
  productId: string;
  initialFavorited: boolean;
  variant?: "inline" | "card";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    const prev = favorited;
    setFavorited(!prev); // optimistic
    startTransition(async () => {
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { favorited: boolean };
        setFavorited(data.favorited);
      } catch {
        setFavorited(prev); // rollback
        setError("Couldn't update wishlist");
      }
    });
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
        className={cn(
          "absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center transition",
          "hover:scale-105",
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4",
            favorited ? "fill-brand-accent text-brand-accent" : "text-neutral-700",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-12 w-12 rounded-md border transition",
        favorited
          ? "border-brand-accent bg-rose-50"
          : "border-neutral-300 hover:bg-neutral-50",
      )}
      aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
      title={error ?? (favorited ? "In your wishlist" : "Add to wishlist")}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          favorited ? "fill-brand-accent text-brand-accent" : "text-neutral-700",
        )}
      />
    </button>
  );
}
