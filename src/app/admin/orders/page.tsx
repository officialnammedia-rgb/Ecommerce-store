import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-4 bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </div>
                </td>
                <td className="px-4 py-3">{o.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-neutral-100 rounded px-2 py-0.5">{o.status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-neutral-100 rounded px-2 py-0.5">
                    {o.paymentMethod ?? "—"} · {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{formatINR(o.grandTotal)}</td>
                <td className="px-4 py-3 text-right text-neutral-500">
                  {o.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
