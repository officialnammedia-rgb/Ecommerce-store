import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatINR } from "@/lib/utils";
import { ReturnAdminActions } from "@/components/admin/ReturnAdminActions";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  await requireAdmin();
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });
  const orderIds = Array.from(new Set(returns.map((r) => r.orderId)));
  const userIds = Array.from(new Set(returns.map((r) => r.userId)));
  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true, grandTotal: true, email: true },
      })
    : [];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const counts = {
    REQUESTED: returns.filter((r) => r.status === "REQUESTED").length,
    APPROVED: returns.filter((r) => r.status === "APPROVED").length,
    REFUNDED: returns.filter((r) => r.status === "REFUNDED").length,
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold">Returns</h1>
      <div className="mt-2 flex gap-3 text-sm text-neutral-600">
        <span>
          <b>{counts.REQUESTED}</b> requested
        </span>
        <span>
          <b>{counts.APPROVED}</b> approved
        </span>
        <span>
          <b>{counts.REFUNDED}</b> refunded
        </span>
      </div>

      <div className="mt-6 bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Refund</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {returns.map((r) => {
              const order = orderMap.get(r.orderId);
              const user = userMap.get(r.userId);
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    {order ? (
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {user?.name ?? "Customer"}
                    <br />
                    <span className="text-neutral-500">{user?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs">
                    <p className="line-clamp-3">{r.reason}</p>
                    <p className="text-neutral-500 mt-1">
                      {r.items.length} {r.items.length === 1 ? "item" : "items"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                        r.status === "REQUESTED"
                          ? "bg-amber-100 text-amber-800"
                          : r.status === "APPROVED" || r.status === "RECEIVED"
                            ? "bg-blue-100 text-blue-800"
                            : r.status === "REFUNDED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {r.refundAmount != null
                      ? formatINR(r.refundAmount)
                      : order
                        ? <span className="text-neutral-400">up to {formatINR(order.grandTotal)}</span>
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {r.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <ReturnAdminActions
                      id={r.id}
                      currentStatus={r.status}
                      currentNote={r.adminNote ?? ""}
                      currentRefund={r.refundAmount ?? null}
                      maxRefundPaise={order?.grandTotal ?? 0}
                    />
                  </td>
                </tr>
              );
            })}
            {returns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 text-sm">
                  No return requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
