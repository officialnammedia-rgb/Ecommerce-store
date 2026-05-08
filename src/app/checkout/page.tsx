import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readCart, cartTotals } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { calculateShipping, calculateTax } from "@/lib/orders";
import { listEnabledProviders } from "@/lib/payments";
import { formatINR } from "@/lib/utils";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import type { SavedAddress } from "@/components/storefront/CheckoutForm";
import { getAppliedCouponCode } from "@/app/cart/coupon-actions";
import { validateAndComputeDiscount } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await readCart();
  if (!cart) redirect("/cart");
  const { subtotal, itemCount } = cartTotals(cart);
  if (itemCount === 0) redirect("/cart");

  const session = await getSession();
  const providers = listEnabledProviders();

  const savedAddresses: SavedAddress[] = session?.user?.id
    ? (
        await prisma.address.findMany({
          where: { userId: session.user.id, type: "SHIPPING", savedInBook: true },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        })
      ).map((a) => ({
          id: a.id,
          fullName: a.fullName,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
          isDefault: a.isDefault,
        }))
    : [];

  const couponCode = await getAppliedCouponCode();
  const discountResult = couponCode
    ? await validateAndComputeDiscount(couponCode, subtotal)
    : null;
  const discountAmount = discountResult && discountResult.ok ? discountResult.discount.amount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingTotal = calculateShipping(subtotalAfterDiscount);
  const taxTotal = calculateTax(subtotalAfterDiscount);
  const grandTotal = subtotalAfterDiscount + shippingTotal + taxTotal;

  return (
    <div className="container py-6 sm:py-10 grid lg:grid-cols-3 gap-6 lg:gap-10">
      <div className="lg:col-span-2">
        <CheckoutForm
          providers={providers.map((p) => ({ id: p.id, label: p.label }))}
          defaultEmail={session?.user?.email ?? ""}
          defaultName={session?.user?.name ?? ""}
          grandTotal={grandTotal}
          savedAddresses={savedAddresses}
          isLoggedIn={!!session?.user?.id}
        />
      </div>

      <aside className="bg-neutral-50 rounded-lg p-6 h-fit">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-3 divide-y text-sm">
          {cart.items.map((item) => {
            const v = item.variant;
            return (
              <li key={item.id} className="py-3 flex gap-3">
                <div className="w-14 h-16 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
                  {v.product.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.product.images[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.product.title}</p>
                  <p className="text-xs text-neutral-500">
                    {[v.optionValue1, v.optionValue2].filter(Boolean).join(" / ")}
                  </p>
                  <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                </div>
                <div className="text-right">
                  {formatINR(item.priceSnapshot * item.quantity)}
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(subtotal)}</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount ({discountResult?.ok ? discountResult.discount.code : ""})</dt>
              <dd>- {formatINR(discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{shippingTotal === 0 ? "Free" : formatINR(shippingTotal)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-3">
            <dt>Total</dt>
            <dd>{formatINR(grandTotal)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
