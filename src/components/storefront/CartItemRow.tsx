"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type CartRowItem = {
  id: string;
  quantity: number;
  priceSnapshot: number;
  productSlug: string;
  productTitle: string;
  imageUrl: string | null;
  variantOptions: string;
  inventoryQty: number;
};

export function CartItemRow({ item }: { item: CartRowItem }) {
  const router = useRouter();
  const toast = useToast();
  const [qty, setQty] = useState(item.quantity);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(newQty: number) {
    setError(null);
    setQty(newQty);
    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id, quantity: newQty }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Update failed");
        }
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Update failed");
        setQty(item.quantity);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/remove", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Remove failed");
        }
        toast.info("Removed from cart");
        router.refresh();
      } catch (e: any) {
        const msg = e?.message ?? "Remove failed";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  const lowStock = item.inventoryQty > 0 && item.inventoryQty <= 5;
  const atCap = qty >= item.inventoryQty;

  return (
    <li className="py-4 flex gap-4">
      <div className="w-24 h-28 bg-neutral-100 rounded overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1">
        <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
          {item.productTitle}
        </Link>
        {item.variantOptions && (
          <div className="text-sm text-neutral-500">{item.variantOptions}</div>
        )}
        <div className="mt-1 text-sm">{formatINR(item.priceSnapshot)}</div>
        {lowStock && (
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-full px-2 py-0.5">
            <AlertTriangle className="h-3 w-3" />
            Only {item.inventoryQty} left
          </div>
        )}
        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex items-center border border-neutral-300 rounded-md overflow-hidden">
            <button
              type="button"
              aria-label="Decrease"
              disabled={pending || qty <= 1}
              onClick={() => update(Math.max(1, qty - 1))}
              className="px-3 h-9 text-lg disabled:opacity-40"
            >
              −
            </button>
            <span className="px-3 text-sm tabular-nums w-8 text-center">{qty}</span>
            <button
              type="button"
              aria-label="Increase"
              disabled={pending || atCap}
              onClick={() => update(qty + 1)}
              className="px-3 h-9 text-lg disabled:opacity-40"
              title={atCap ? "No more stock available" : undefined}
            >
              +
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <div className="text-right font-medium">
        {formatINR(item.priceSnapshot * qty)}
      </div>
    </li>
  );
}
