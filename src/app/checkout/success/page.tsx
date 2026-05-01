import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order;
  if (!orderNumber) notFound();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, shippingAddress: true },
  });
  if (!order) notFound();

  return (
    <div className="container py-12 max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Thank you for your order!</h1>
        <p className="mt-2 text-neutral-600">
          A confirmation has been recorded for{" "}
          <span className="font-mono font-medium">{order.orderNumber}</span>.
        </p>
      </div>

      <div className="mt-8 bg-white border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-2 divide-y text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between">
                <span>
                  {it.productTitle}
                  {it.variantTitle ? ` — ${it.variantTitle}` : ""} × {it.quantity}
                </span>
                <span>{formatINR(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="text-sm space-y-1 border-t pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shippingTotal === 0 ? "Free" : formatINR(order.shippingTotal)}</dd>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <dt>Total</dt>
            <dd>{formatINR(order.grandTotal)}</dd>
          </div>
        </dl>
        {order.shippingAddress && (
          <div className="border-t pt-3 text-sm">
            <p className="font-medium">Shipping to</p>
            <p className="text-neutral-700">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        )}
        <p className="text-sm text-neutral-500 border-t pt-3">
          Payment method: <span className="font-medium">{order.paymentMethod}</span> · Status:{" "}
          {order.status}
        </p>
      </div>

      <div className="mt-8 flex gap-3 justify-center">
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-100"
        >
          View my orders
        </Link>
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
