"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";

type OrderItem = {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
};

export function ReturnRequestForm({
  orderId,
  orderNumber,
  items,
}: {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((it) => [it.id, 0])),
  );
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const selected = items
      .map((it) => ({ orderItemId: it.id, quantity: qty[it.id] ?? 0 }))
      .filter((it) => it.quantity > 0);
    if (selected.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    if (reason.trim().length < 5) {
      toast.error("Tell us briefly why you're returning");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/returns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId, reason, items: selected }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not submit return");
          return;
        }
        toast.success("Return request submitted. We'll email you within 1–2 days.");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Request return
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-neutral-200 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold">Items to return from {orderNumber}</p>
        <ul className="mt-2 divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-2 flex items-center gap-3">
              <div className="flex-1 text-sm">
                <p className="font-medium">{it.productTitle}</p>
                {it.variantTitle && (
                  <p className="text-xs text-neutral-500">{it.variantTitle}</p>
                )}
                <p className="text-xs text-neutral-500">
                  Ordered {it.quantity} · {formatINR(it.unitPrice)} ea
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-600">Return qty</label>
                <input
                  type="number"
                  min={0}
                  max={it.quantity}
                  value={qty[it.id] ?? 0}
                  onChange={(e) =>
                    setQty({ ...qty, [it.id]: Math.max(0, Math.min(it.quantity, Number(e.target.value) || 0)) })
                  }
                  className="w-16 h-9 rounded-md border border-neutral-300 px-2 text-sm text-center"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label className="text-sm font-medium">Reason for return</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          placeholder="Wrong size, damaged on arrival, didn't fit, etc."
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit return request"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
      <p className="text-[11px] text-neutral-500">
        Returns are accepted on unworn items with tags within 7 days of delivery. We&apos;ll
        review and email you with next steps.
      </p>
    </form>
  );
}
