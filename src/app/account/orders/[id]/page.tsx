import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatINR } from "@/lib/utils";
import { CancelOrderButton } from "@/components/storefront/CancelOrderButton";
import { ReturnRequestForm } from "@/components/storefront/ReturnRequestForm";

export const dynamic = "force-dynamic";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireUser();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      shippingAddress: true,
      fulfillments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order || order.userId !== session.user.id) notFound();

  const existingReturn = await prisma.return.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });
  const returnEligible =
    (order.status === "FULFILLED" || order.status === "PAID") &&
    !existingReturn &&
    (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 7;

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/account" className="text-sm underline">
        ← Back to account
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">
            Placed {order.createdAt.toLocaleString()} · Status:{" "}
            <span className="font-medium">{order.status.replace(/_/g, " ")}</span>
          </p>
        </div>
        {(order.status === "PENDING_PAYMENT" || order.status === "PAID") && (
          <CancelOrderButton orderNumber={order.orderNumber} />
        )}
      </div>

      <div className="mt-6 bg-white border rounded-lg p-5">
        <ul className="divide-y text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex gap-3">
              <div className="w-14 h-16 rounded bg-neutral-100 overflow-hidden">
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium">{it.productTitle}</p>
                {it.variantTitle && (
                  <p className="text-xs text-neutral-500">{it.variantTitle}</p>
                )}
                <p className="text-xs text-neutral-500">Qty {it.quantity}</p>
              </div>
              <div className="text-right">{formatINR(it.unitPrice * it.quantity)}</div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 text-sm border-t pt-3">
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
      </div>

      {order.fulfillments.length > 0 && (
        <div className="mt-6 bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Shipments</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {order.fulfillments.map((f) => (
              <li key={f.id}>
                {f.carrier} · {f.trackingNumber}
                {f.trackingUrl ? (
                  <>
                    {" "}·{" "}
                    <a href={f.trackingUrl} target="_blank" className="underline" rel="noreferrer">
                      Track
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {existingReturn && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h2 className="font-semibold">Return request</h2>
          <p className="mt-1 text-sm">
            Status: <span className="font-medium">{existingReturn.status}</span>
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Requested {existingReturn.createdAt.toLocaleString()}
          </p>
          {existingReturn.adminNote && (
            <p className="mt-2 text-sm text-neutral-700">
              <span className="font-medium">Note from us:</span> {existingReturn.adminNote}
            </p>
          )}
        </div>
      )}

      {returnEligible && (
        <div className="mt-6">
          <ReturnRequestForm
            orderId={order.id}
            orderNumber={order.orderNumber}
            items={order.items.map((it) => ({
              id: it.id,
              productTitle: it.productTitle,
              variantTitle: it.variantTitle,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            }))}
          />
        </div>
      )}

      {order.shippingAddress && (
        <div className="mt-6 bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Shipping to</h2>
          <p className="mt-2 text-sm">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}
          </p>
        </div>
      )}
    </div>
  );
}
