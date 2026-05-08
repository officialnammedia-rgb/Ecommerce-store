import Link from "next/link";
import { readCart, cartTotals } from "@/lib/cart";
import { formatINR } from "@/lib/utils";
import { getAppliedCouponCode } from "./coupon-actions";
import { validateAndComputeDiscount } from "@/lib/discounts";
import { CouponForm } from "@/components/storefront/CouponForm";
import { CartItemRow, type CartRowItem } from "@/components/storefront/CartItemRow";
import { FreeShippingBar } from "@/components/storefront/FreeShippingBar";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await readCart();
  const { subtotal, itemCount } = cart ? cartTotals(cart) : { subtotal: 0, itemCount: 0 };
  const couponCode = await getAppliedCouponCode();
  const discountResult = couponCode
    ? await validateAndComputeDiscount(couponCode, subtotal)
    : null;
  const discountAmount = discountResult && discountResult.ok ? discountResult.discount.amount : 0;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  if (itemCount === 0) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600">Find something you love.</p>
        <div className="mt-6">
          <Link
            href="/collections/all"
            className="inline-flex items-center justify-center rounded-md bg-brand text-brand-foreground px-6 py-3 font-medium hover:opacity-90"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const rows: CartRowItem[] = cart!.items.map((it) => {
    const v = it.variant;
    return {
      id: it.id,
      quantity: it.quantity,
      priceSnapshot: it.priceSnapshot,
      productSlug: v.product.slug,
      productTitle: v.product.title,
      imageUrl: v.product.images[0]?.url ?? null,
      variantOptions: [v.optionValue1, v.optionValue2, v.optionValue3].filter(Boolean).join(" / "),
      inventoryQty: v.inventoryQty,
    };
  });

  return (
    <div className="container py-6 sm:py-10 grid lg:grid-cols-3 gap-6 lg:gap-10">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-semibold">Your cart</h1>
        <ul className="mt-4 sm:mt-6 divide-y border-t border-b">
          {rows.map((r) => (
            <CartItemRow key={r.id} item={r} />
          ))}
        </ul>
      </div>

      <aside className="bg-neutral-50 rounded-lg p-4 sm:p-6 h-fit space-y-4">
        <h2 className="font-semibold">Summary</h2>
        <FreeShippingBar subtotal={subtotal} />
        <CouponForm appliedCode={discountResult?.ok ? discountResult.discount.code : null} />
        {couponCode && discountResult && !discountResult.ok && (
          <p className="text-xs text-red-600">{discountResult.error}</p>
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(subtotal)}</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>- {formatINR(discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-neutral-500">
            <dt>Shipping</dt>
            <dd>Calculated at checkout</dd>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <dt>Estimated total</dt>
            <dd>{formatINR(totalAfterDiscount)}</dd>
          </div>
        </dl>
        <Link
          href="/checkout"
          className="inline-flex w-full items-center justify-center rounded-md bg-brand text-brand-foreground px-6 py-3 font-medium hover:opacity-90"
        >
          Checkout · {formatINR(totalAfterDiscount)}
        </Link>
        <Link href="/collections/all" className="block text-center text-sm underline">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
