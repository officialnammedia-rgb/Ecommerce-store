"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

// Address fields can contain letters, numbers, spaces and these common
// punctuation marks. Strips anything that could be used for HTML/script
// injection or that's just garbage in a postal address.
const ADDRESS_ALLOWED = /[^\p{L}\p{N}\s,./\-#'&()]/gu;
function sanitizeAddress(s: string) {
  return s.replace(ADDRESS_ALLOWED, "").replace(/\s{2,}/g, " ");
}

// Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9.
function isValidIndianMobile10(d: string) {
  return /^[6-9]\d{9}$/.test(d);
}

// Extract the last 10 digits from any saved phone string (handles legacy
// formats like "+919876543210", "9876543210", or even with spaces). Returns
// "" unless the result is a valid 10-digit Indian mobile (must start with
// 6/7/8/9) so we never prefill the input with garbage like "00" from
// malformed legacy address records.
function toMobile10(s: string | null | undefined): string {
  const digits = (s ?? "").replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(last10) ? last10 : "";
}

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
  isLoggedIn = false,
}: {
  providers: Provider[];
  defaultEmail: string;
  defaultName: string;
  grandTotal: number;
  savedAddresses?: SavedAddress[];
  isLoggedIn?: boolean;
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

  const [saveAddress, setSaveAddress] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

  // Controlled fields for the "new address" path. Saved-address path uses
  // hidden inputs populated from the chosen `selected` object.
  const [phone10, setPhone10] = useState<string>(toMobile10(selected?.phone) || "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // When the user toggles between saved addresses, refresh the local 10-digit
  // phone slice so the visible value matches the picked address.
  useEffect(() => {
    setPhone10(toMobile10(selected?.phone) || "");
  }, [selected?.phone]);

  const phoneValid = phone10.length === 0 || isValidIndianMobile10(phone10);

  // Pincode auto-lookup. Hits the public Indian Postal API at
  // api.postalpincode.in — free, no key, returns the office list for a PIN.
  // We pull City + State from the first record.
  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  async function lookupPincode(pin: string) {
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeStatus("loading");
    setPincodeError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : null;
      if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
        setPincodeStatus("error");
        setPincodeError("Could not find this PIN code. Please check and try again.");
        return;
      }
      const office = entry.PostOffice[0];
      setCity((prev) => prev || office.District || office.Block || "");
      setStateName((prev) => prev || office.State || "");
      setPincodeStatus("ok");
    } catch {
      setPincodeStatus("error");
      setPincodeError("Could not verify PIN code. Please fill city/state manually.");
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      payload[k] = String(v);
    });
    if (!payload.country) payload.country = "IN";

    const usingSavedAddr = selectedAddressId !== "new" && !!selected;
    if (usingSavedAddr) payload.savedAddressId = selected!.id;

    // Compose the final phone as +91XXXXXXXXXX. The visible phone10 input is
    // the source of truth for both new-address and saved-address paths — the
    // useEffect above keeps phone10 in sync with the picked saved address, and
    // the user is free to override it (e.g. when a saved address has a stale
    // or malformed phone).
    if (!isValidIndianMobile10(phone10)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    payload.phone = `+91${phone10}`;

    // For the new-address path, push controlled values into the payload
    // (FormData already has them since the inputs are controlled with `name`,
    // but we set them explicitly so a stale browser autofill never wins).
    if (!usingSavedAddr) {
      const cleanLine1 = sanitizeAddress(line1).trim();
      const cleanLine2 = sanitizeAddress(line2).trim();
      if (!cleanLine1) {
        setError("Please enter your street address.");
        return;
      }
      if (!/^\d{6}$/.test(postalCode)) {
        setError("PIN code must be 6 digits.");
        return;
      }
      payload.line1 = cleanLine1;
      payload.line2 = cleanLine2;
      payload.city = sanitizeAddress(city).trim();
      payload.state = sanitizeAddress(stateName).trim();
      payload.postalCode = postalCode;
    }

    // Only forward saveAddress when logged in AND typing a new address.
    if (isLoggedIn && !usingSavedAddr) payload.saveAddress = saveAddress;

    // Guest who wants to sign up during checkout.
    const wantsAccount = !isLoggedIn && createAccount && accountPassword.length >= 8;

    startTransition(async () => {
      try {
        // 1) Create + sign in the account first, so the order attaches to the user.
        if (wantsAccount) {
          const regRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: String(payload.fullName ?? "").trim() || "Customer",
              email: String(payload.email ?? "").trim().toLowerCase(),
              password: accountPassword,
            }),
          });
          if (!regRes.ok) {
            const d = await regRes.json().catch(() => ({}));
            // 409 = email in use. Tell them to uncheck + sign in instead.
            setError(
              d.error === "Email already in use"
                ? "That email is already registered — uncheck the box and sign in before checking out, or use a different email."
                : d.error ?? "Could not create account",
            );
            return;
          }
          const signed = await signIn("credentials", {
            email: String(payload.email).trim().toLowerCase(),
            password: accountPassword,
            redirect: false,
          });
          if (signed?.error) {
            setError("Account created, but sign-in failed. You can still place the order as a guest.");
            return;
          }
        }

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

      <fieldset className="space-y-3 bg-white border rounded-lg p-4 sm:p-5">
        <legend className="px-2 font-medium">Contact</legend>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input name="email" type="email" required defaultValue={defaultEmail} />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-600 text-sm">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              placeholder="9876543210"
              value={phone10}
              onChange={(e) => setPhone10(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 min-w-0 rounded-r-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          {phone10.length > 0 && !phoneValid && (
            <p className="mt-1 text-xs text-red-600">
              Indian mobile numbers must be 10 digits and start with 6, 7, 8, or 9.
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-3 bg-white border rounded-lg p-4 sm:p-5">
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
              <Input
                name="line1"
                required
                value={line1}
                onChange={(e) => setLine1(sanitizeAddress(e.target.value))}
                placeholder="House / flat no., street, area"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address line 2 (optional)</label>
              <Input
                name="line2"
                value={line2}
                onChange={(e) => setLine2(sanitizeAddress(e.target.value))}
                placeholder="Landmark, apartment, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">PIN code</label>
                <Input
                  name="postalCode"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="560001"
                  value={postalCode}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPostalCode(next);
                    if (next.length === 6) {
                      void lookupPincode(next);
                    } else {
                      setPincodeStatus("idle");
                      setPincodeError(null);
                    }
                  }}
                />
                {pincodeStatus === "loading" && (
                  <p className="mt-1 text-xs text-neutral-500">Looking up…</p>
                )}
                {pincodeStatus === "ok" && (
                  <p className="mt-1 text-xs text-emerald-700">Found — city &amp; state filled.</p>
                )}
                {pincodeStatus === "error" && pincodeError && (
                  <p className="mt-1 text-xs text-red-600">{pincodeError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input name="country" defaultValue="IN" required readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(sanitizeAddress(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  name="state"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(sanitizeAddress(e.target.value))}
                />
              </div>
            </div>

            {isLoggedIn && (
              <label className="flex items-center gap-2 text-sm text-neutral-700 pt-1">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4"
                />
                Save this address to my address book for next time
              </label>
            )}
          </>
        )}
      </fieldset>

      {!isLoggedIn && (
        <fieldset className="space-y-3 bg-white border rounded-lg p-4 sm:p-5">
          <legend className="px-2 font-medium">Speed up next time</legend>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <span>
              <span className="font-medium">Create an account</span>
              <span className="block text-xs text-neutral-600">
                Track orders, save addresses, reorder in 2 clicks.
              </span>
            </span>
          </label>
          {createAccount && (
            <div>
              <label className="text-sm font-medium">Choose a password</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                minLength={8}
                required={createAccount}
                placeholder="At least 8 characters"
              />
              <p className="mt-1 text-xs text-neutral-500">
                We&apos;ll use the email above as your sign-in.
              </p>
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-2 bg-white border rounded-lg p-4 sm:p-5">
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

      <fieldset className="space-y-2 bg-white border rounded-lg p-4 sm:p-5">
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
