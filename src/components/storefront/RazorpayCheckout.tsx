"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { siteName } from "@/lib/site";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function RazorpayCheckout({
  keyId,
  razorpayOrderId,
  amount,
  currency,
  orderNumber,
  prefill,
}: {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  prefill: { name?: string | null; email: string; contact?: string | null };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // keep script for navigation back
    };
  }, []);

  async function open() {
    if (!window.Razorpay) {
      setError("Razorpay SDK is still loading. Please retry.");
      return;
    }
    setError(null);
    setLoading(true);
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: siteName(),
      description: `Order ${orderNumber}`,
      prefill: {
        name: prefill.name ?? undefined,
        email: prefill.email,
        contact: prefill.contact ?? undefined,
      },
      handler: async (response: any) => {
        try {
          const res = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              orderNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error ?? "Payment verification failed");
          }
          router.push(`/checkout/success?order=${orderNumber}`);
        } catch (e: any) {
          setError(e?.message ?? "Verification failed");
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
      theme: { color: "#111111" },
    });
    rzp.open();
  }

  return (
    <div className="space-y-3">
      <Button onClick={open} disabled={loading} size="lg" className="w-full">
        {loading ? "Opening Razorpay..." : "Pay now"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
