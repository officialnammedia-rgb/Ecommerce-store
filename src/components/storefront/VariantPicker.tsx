"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatINR, cn } from "@/lib/utils";

type Variant = {
  id: string;
  optionName1: string | null;
  optionValue1: string | null;
  optionName2: string | null;
  optionValue2: string | null;
  price: number;
  compareAtPrice: number | null;
  inventoryQty: number;
};

export function VariantPicker({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"add" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optionGroups = useMemo(() => {
    const groups: { name: string; values: string[] }[] = [];
    for (const v of variants) {
      for (const [name, value] of [
        [v.optionName1, v.optionValue1],
        [v.optionName2, v.optionValue2],
      ] as const) {
        if (!name || !value) continue;
        let g = groups.find((x) => x.name === name);
        if (!g) {
          g = { name, values: [] };
          groups.push(g);
        }
        if (!g.values.includes(value)) g.values.push(value);
      }
    }
    return groups;
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const g of optionGroups) initial[g.name] = "";
    return initial;
  });

  const matched = useMemo(() => {
    return variants.find((v) => {
      const pairs = [
        [v.optionName1, v.optionValue1],
        [v.optionName2, v.optionValue2],
      ] as const;
      for (const [n, val] of pairs) {
        if (!n) continue;
        if (selected[n] !== val) return false;
      }
      return optionGroups.every((g) => selected[g.name]);
    });
  }, [variants, selected, optionGroups]);

  const inStock = matched && matched.inventoryQty > 0;

  function isAvailable(name: string, value: string) {
    return variants.some((v) => {
      const pairs = [
        [v.optionName1, v.optionValue1],
        [v.optionName2, v.optionValue2],
      ] as const;
      let matchesValue = false;
      let matchesOthers = true;
      for (const [n, val] of pairs) {
        if (!n) continue;
        if (n === name) {
          if (val === value) matchesValue = true;
          else continue;
        } else {
          const sel = selected[n];
          if (sel && sel !== val) matchesOthers = false;
        }
      }
      return matchesValue && matchesOthers && v.inventoryQty > 0;
    });
  }

  async function callAdd(): Promise<void> {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId: matched!.id, quantity: 1 }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Could not add to cart");
    }
  }

  async function callBuyNow(): Promise<string> {
    const res = await fetch("/api/cart/buy-now", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId: matched!.id, quantity: 1 }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Could not start checkout");
    }
    const data = (await res.json()) as { redirect?: string };
    return data.redirect ?? "/checkout";
  }

  function onAdd() {
    if (!matched) {
      setError("Please choose all options.");
      return;
    }
    setError(null);
    setAction("add");
    startTransition(async () => {
      try {
        await callAdd();
        toast.success("Added to cart");
        router.refresh();
      } catch (e: any) {
        const msg = e?.message ?? "Could not add to cart";
        setError(msg);
        toast.error(msg);
      } finally {
        setAction(null);
      }
    });
  }

  function onBuyNow() {
    if (!matched) {
      setError("Please choose all options.");
      return;
    }
    setError(null);
    setAction("buy");
    startTransition(async () => {
      try {
        const target = await callBuyNow();
        router.push(target);
      } catch (e: any) {
        const msg = e?.message ?? "Could not start checkout";
        setError(msg);
        toast.error(msg);
        setAction(null);
      }
    });
  }

  const displayPrice = matched?.price ?? Math.min(...variants.map((v) => v.price));
  const displayCompareAt = matched?.compareAtPrice ?? null;
  const discountPct =
    displayCompareAt && displayCompareAt > displayPrice
      ? Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100)
      : null;

  const totalStock = variants.reduce((acc, v) => acc + v.inventoryQty, 0);
  let stockMsg: { tone: "good" | "low" | "none"; text: string } | null = null;
  if (totalStock === 0) {
    stockMsg = { tone: "none", text: "Sold out" };
  } else if (matched) {
    if (matched.inventoryQty === 0) {
      stockMsg = { tone: "none", text: "This combination is sold out" };
    } else if (matched.inventoryQty <= 3) {
      stockMsg = {
        tone: "low",
        text: `Hurry — only ${matched.inventoryQty} left in stock`,
      };
    } else if (matched.inventoryQty <= 10) {
      stockMsg = { tone: "low", text: `Only ${matched.inventoryQty} left` };
    } else {
      stockMsg = { tone: "good", text: "In stock" };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl font-semibold">{formatINR(displayPrice)}</span>
        {displayCompareAt && displayCompareAt > displayPrice && (
          <>
            <span className="text-base text-neutral-400 line-through">
              {formatINR(displayCompareAt)}
            </span>
            {discountPct && (
              <span className="text-sm font-semibold text-green-700">
                {discountPct}% OFF
              </span>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-neutral-500 -mt-4">Inclusive of all taxes</p>

      {stockMsg && (
        <div
          className={cn(
            "inline-flex items-center gap-2 -mt-2 text-xs font-semibold rounded-full px-3 py-1",
            stockMsg.tone === "low" && "bg-amber-50 text-amber-800",
            stockMsg.tone === "none" && "bg-neutral-200 text-neutral-700",
            stockMsg.tone === "good" && "bg-emerald-50 text-emerald-800",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              stockMsg.tone === "low" && "bg-amber-500 animate-pulse",
              stockMsg.tone === "none" && "bg-neutral-500",
              stockMsg.tone === "good" && "bg-emerald-500",
            )}
          />
          {stockMsg.text}
        </div>
      )}

      {optionGroups.map((g) => (
        <div key={g.name}>
          <p className="text-sm font-medium">
            {g.name}
            {selected[g.name] ? (
              <span className="text-neutral-500 font-normal"> · {selected[g.name]}</span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.values.map((v) => {
              const enabled = isAvailable(g.name, v);
              const active = selected[g.name] === v;
              return (
                <button
                  type="button"
                  key={v}
                  onClick={() => setSelected((s) => ({ ...s, [g.name]: v }))}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm border transition",
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white hover:bg-neutral-50",
                    !enabled && "opacity-40 line-through",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Button
          onClick={onAdd}
          disabled={!matched || !inStock || pending}
          size="lg"
          variant="outline"
          className="h-12"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          {action === "add" && pending
            ? "Adding..."
            : !matched
              ? "Select options"
              : !inStock
                ? "Sold out"
                : "Add to cart"}
        </Button>
        <Button
          onClick={onBuyNow}
          disabled={!matched || !inStock || pending}
          size="lg"
          className="h-12 bg-brand-accent hover:bg-rose-700 text-white"
        >
          <Zap className="h-4 w-4 mr-2" />
          {action === "buy" && pending ? "Loading..." : "Buy now"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
