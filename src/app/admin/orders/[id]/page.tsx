import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateOrderStatusAction,
  fulfillOrderAction,
  addOrderNoteAction,
  refundOrderAction,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING_PAYMENT", "PAID", "FULFILLED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      shippingAddress: true,
      payments: true,
      fulfillments: { orderBy: { createdAt: "desc" } },
      user: true,
    },
  });
  if (!order) notFound();

  const updateStatus = updateOrderStatusAction.bind(null, order.id);
  const fulfill = fulfillOrderAction.bind(null, order.id);
  const addNote = addOrderNoteAction.bind(null, order.id);
  const refund = refundOrderAction.bind(null, order.id);

  return (
    <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <p className="text-sm text-neutral-500">
              Placed {order.createdAt.toLocaleString()}
            </p>
          </div>
          <Link href="/admin/orders" className="text-sm underline">
            ← All orders
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 divide-y text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="py-3 flex gap-3">
                <div className="w-14 h-16 rounded bg-neutral-100 overflow-hidden flex-shrink-0">
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
                  <p className="text-xs text-neutral-500 font-mono">{it.sku}</p>
                </div>
                <div className="text-right">
                  <p>
                    {formatINR(it.unitPrice)} × {it.quantity}
                  </p>
                  <p className="font-medium">{formatINR(it.unitPrice * it.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm border-t pt-3">
            <Row label="Subtotal" value={formatINR(order.subtotal)} />
            <Row label="Discount" value={`- ${formatINR(order.discountTotal)}`} />
            <Row
              label="Shipping"
              value={order.shippingTotal === 0 ? "Free" : formatINR(order.shippingTotal)}
            />
            <Row label="Tax" value={formatINR(order.taxTotal)} />
            <Row
              label="Total"
              value={formatINR(order.grandTotal)}
              bold
            />
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Fulfillments</h2>
          {order.fulfillments.length === 0 && (
            <p className="text-sm text-neutral-500 mt-2">No fulfillments yet.</p>
          )}
          <ul className="mt-3 space-y-2 text-sm">
            {order.fulfillments.map((f) => (
              <li key={f.id} className="border rounded p-3">
                <p className="font-medium">{f.carrier}</p>
                <p className="text-neutral-600">
                  {f.trackingNumber}
                  {f.trackingUrl ? (
                    <>
                      {" "}·{" "}
                      <a href={f.trackingUrl} target="_blank" className="underline" rel="noreferrer">
                        Track
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-neutral-500">
                  {f.status}
                  {f.shippedAt ? ` · shipped ${f.shippedAt.toLocaleDateString()}` : ""}
                </p>
              </li>
            ))}
          </ul>

          <form action={fulfill} className="mt-4 grid md:grid-cols-3 gap-2">
            <Input name="carrier" placeholder="Carrier (Delhivery, BlueDart...)" required />
            <Input name="trackingNumber" placeholder="Tracking number" required />
            <Input name="trackingUrl" placeholder="https://tracking-url..." />
            <div className="md:col-span-3">
              <Button type="submit">Add fulfillment & mark fulfilled</Button>
            </div>
          </form>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Notes</h2>
          <form action={addNote} className="mt-2">
            <textarea
              name="notes"
              defaultValue={order.notes ?? ""}
              rows={3}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <Button type="submit" variant="outline" size="sm" className="mt-2">
              Save notes
            </Button>
          </form>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Status</h2>
          <p className="mt-2 text-sm">
            <span className="px-2 py-0.5 bg-neutral-100 rounded">{order.status}</span>
          </p>
          <form action={updateStatus} className="mt-3 flex items-center gap-2">
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm flex-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">Update</Button>
          </form>
          <p className="text-xs text-neutral-500 mt-2">
            Cancelling or refunding restocks inventory.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2 text-sm">{order.email}</p>
          {order.phone && <p className="text-sm">{order.phone}</p>}
          {order.user && (
            <p className="text-xs text-neutral-500 mt-1">
              Account: {order.user.name ?? order.user.email}
            </p>
          )}
        </div>

        {order.shippingAddress && (
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold">Shipping address</h2>
            <p className="mt-2 text-sm">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        )}

        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold">Payments</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {order.payments.map((p) => (
              <li key={p.id} className="border rounded p-2">
                <p className="font-medium">{p.provider} · {p.status}</p>
                <p className="text-xs text-neutral-500">
                  {formatINR(p.amount)}
                  {p.providerPaymentId ? ` · ${p.providerPaymentId}` : ""}
                </p>
              </li>
            ))}
            {order.payments.length === 0 && (
              <li className="text-neutral-500">No payment records.</li>
            )}
          </ul>
          {order.paymentStatus !== "REFUNDED" && (
            <form action={refund} className="mt-3">
              <Button type="submit" variant="destructive" size="sm">
                Refund full order
              </Button>
              <p className="text-xs text-neutral-500 mt-1">
                Restocks inventory. For Razorpay-paid orders, calls the refund API.
              </p>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold border-t pt-2" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
