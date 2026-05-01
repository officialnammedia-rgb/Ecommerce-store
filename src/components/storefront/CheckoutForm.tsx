"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

type Provider = { id: string; label: string };

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export function CheckoutForm({
  providers,
  defaultEmail,
  defaultName,
  grandTotal,
  savedAddresses = [],
}: {
  providers: Provider[];
  defaultEmail: string;
  defaultName: string;
  grandTotal: number;
  savedAddresses?: SavedAddress[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultAddressId = useMemo(() => {
    if (savedAddresses.length === 0) return "new";
    return savedAddresses.find((a) => a.isDefault)?.id ?? savedAddresses[0].id;
  }, [savedAddresses]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddressId);
  const selected =
    selectedAddressId !== "new"
      ? savedAddresses.find((a) => a.id === selectedAddressId)
      : undefined;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => {
      payload[k] = String(v);
    });
    if (!payload.country) payload.country = "IN";

    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout/place", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Could not place order");
          return;
        }
        router.push(data.redirect);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  const usingSaved = selectedAddressId !== "new" && !!selected;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <fieldset className="space-y-3 bg-white border rounded-lg p-5">
        <legend className="px-2 font-medium">Contact</legend>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input name="email" type="email" required defaultValue={defaultEmail} />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input
            name="phone"
            required
            placeholder="9876543210"
            defaultValue={selected?.phone ?? ""}
            key={`phone-${selectedAddressId}`}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3 bg-white border rounded-lg p-5">
        <legend className="px-2 font-medium">Shipping address</legend>

        {savedAddresses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600">Choose a saved address</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {savedAddresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                    selectedAddressId === a.id
                      ? "border-neutral-900 ring-1 ring-neutral-900/10 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    className="mt-1"
                    checked={selectedAddressId === a.id}
                    onChange={() => setSelectedAddressId(a.id)}
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {a.fullName}
                      {a.isDefault && (
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-emerald-700">
                          · Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">
                      {a.line1}, {a.city} {a.postalCode}
                    </p>
                  </div>
                </label>
              ))}
              <label
                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                  selectedAddressId === "new"
                    ? "border-neutral-900 ring-1 ring-neutral-900/10 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedAddressId === "new"}
                  onChange={() => setSelectedAddressId("new")}
                />
                <span className="font-medium">Use a different address</span>
              </label>
            </div>
            <Link
              href="/account/addresses"
              className="text-xs underline text-neutral-500 hover:text-neutral-900"
            >
              Manage saved addresses
            </Link>
          </div>
        )}

        {usingSaved ? (
          <input type="hidden" name="fullName" value={selected!.fullName} />
        ) : (
          <div>
            <label className="text-sm font-medium">Full name</label>
            <Input name="fullName" required defaultValue={defaultName} />
          </div>
        )}

        {usingSaved ? (
          <>
            <input type="hidden" name="line1" value={selected!.line1} />
            <input type="hidden" name="line2" value={selected!.line2 ?? ""} />
            <input type="hidden" name="city" value={selected!.city} />
            <input type="hidden" name="state" value={selected!.state} />
            <input type="hidden" name="postalCode" value={selected!.postalCode} />
            <input type="hidden" name="country" value={selected!.country || "IN"} />
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium">Address line 1</label>
              <Input name="line1" required />
            </div>
            <div>
              <label className="text-sm font-medium">Address line 2 (optional)</label>
              <Input name="line2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input name="city" required />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input name="state" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Postal code</label>
                <Input name="postalCode" required />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input name="country" defaultValue="IN" required />
              </div>
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-2 bg-white border rounded-lg p-5">
        <legend className="px-2 font-medium">Payment</legend>
        {providers.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer hover:bg-neutral-50"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={p.id}
              defaultChecked={p.id === "COD"}
            />
            <span className="text-sm font-medium">{p.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2 bg-white border rounded-lg p-5">
        <legend className="px-2 font-medium">Order notes (optional)</legend>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Any special instructions..."
        />
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Placing order..." : `Place order · ${formatINR(grandTotal)}`}
      </Button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <p className="text-xs text-neutral-500 text-center">
        By placing this order you agree to our{" "}
        <Link href="/pages/terms" className="underline">
          terms
        </Link>
        .
      </p>
    </form>
  );
}
