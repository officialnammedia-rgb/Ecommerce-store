"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function cancel() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/orders/cancel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNumber }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not cancel order");
          return;
        }
        toast.success("Order cancelled. Refund (if paid) will be initiated shortly.");
        setConfirming(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        Cancel order
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Cancel this order?</span>
      <Button type="button" size="sm" variant="destructive" onClick={cancel} disabled={pending}>
        {pending ? "..." : "Yes, cancel"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Keep order
      </Button>
    </div>
  );
}
