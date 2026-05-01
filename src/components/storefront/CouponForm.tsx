"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CouponForm({ appliedCode }: { appliedCode: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/coupon", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Could not apply code");
          return;
        }
        setCode("");
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        await fetch("/api/coupon", { method: "DELETE" });
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>
          Code <span className="font-mono font-medium">{appliedCode}</span> applied
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="flex items-center gap-2">
      <Input
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Discount code"
        className="h-9"
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending || !code.trim()}>
        {pending ? "..." : "Apply"}
      </Button>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </form>
  );
}
