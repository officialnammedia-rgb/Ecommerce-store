import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { RazorpayCheckout } from "@/components/storefront/RazorpayCheckout";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: { orderNumber: string } }) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) notFound();
  if (order.paymentMethod !== "RAZORPAY") notFound();
  if (order.paymentStatus === "PAID") {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">Order already paid</h1>
        <p className="text-neutral-600 mt-2">
          Order {order.orderNumber} is already marked paid.
        </p>
      </div>
    );
  }

  const payment = order.payments[0];
  if (!payment?.providerOrderId) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">Payment unavailable</h1>
        <p className="text-neutral-600 mt-2">
          We couldn&apos;t initialize Razorpay for this order. Please contact support.
        </p>
      </div>
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID!;

  return (
    <div className="container py-10 max-w-md">
      <h1 className="text-2xl font-semibold">Complete payment</h1>
      <p className="text-neutral-600 mt-1">
        Order <span className="font-mono">{order.orderNumber}</span>
      </p>
      <div className="mt-6 bg-white border rounded-lg p-5">
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount</dt>
              <dd>- {formatINR(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shippingTotal === 0 ? "Free" : formatINR(order.shippingTotal)}</dd>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <dt>Total</dt>
            <dd>{formatINR(order.grandTotal)}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <RazorpayCheckout
            keyId={keyId}
            razorpayOrderId={payment.providerOrderId}
            amount={order.grandTotal}
            currency={order.currency}
            orderNumber={order.orderNumber}
            prefill={{ email: order.email, contact: order.phone }}
          />
        </div>
      </div>
    </div>
  );
}
