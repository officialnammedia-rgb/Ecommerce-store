import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { LiveVisitors } from "@/components/admin/LiveVisitors";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    orderCount,
    customerCount,
    paidAgg,
    recentOrders,
    lowStock,
    liveRows,
    monthRows,
    topPages,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, orderNumber: true, email: true, grandTotal: true, status: true, createdAt: true },
    }),
    prisma.productVariant.findMany({
      where: { inventoryQty: { lt: 5 } },
      take: 5,
      include: { product: { select: { title: true, slug: true } } },
    }),
    // Live: distinct sessions active in the last 5 minutes.
    prisma.pageView.findMany({
      where: { createdAt: { gte: fiveMinAgo } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Monthly: distinct sessions so far this month.
    prisma.pageView.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    // Top pages this month.
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: startOfMonth } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
  ]);

  const liveCount = liveRows.length;
  const monthCount = monthRows.length;

  const stats = [
    { label: "Revenue (paid)", value: formatINR(paidAgg._sum.grandTotal ?? 0) },
    { label: "Orders", value: orderCount.toString() },
    { label: "Products", value: productCount.toString() },
    { label: "Customers", value: customerCount.toString() },
  ];

  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <LiveVisitors initial={liveCount} />
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Unique visitors · {monthLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold">{monthCount}</p>
          <p className="mt-1 text-[11px] text-neutral-400">
            Distinct anonymous sessions
          </p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Top pages this month</p>
          <ul className="mt-2 space-y-1 text-sm">
            {topPages.length === 0 && (
              <li className="text-neutral-400 text-xs">No traffic recorded yet.</li>
            )}
            {topPages.map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3">
                <span className="truncate text-neutral-800">{p.path}</span>
                <span className="text-neutral-500 tabular-nums">{p._count.path}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm underline">View all</Link>
          </div>
          <ul className="mt-3 divide-y">
            {recentOrders.length === 0 && <li className="py-3 text-sm text-neutral-500">No orders yet.</li>}
            {recentOrders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium">{o.orderNumber}</Link>
                  <div className="text-neutral-500">{o.email}</div>
                </div>
                <div className="text-right">
                  <div>{formatINR(o.grandTotal)}</div>
                  <div className="text-neutral-500">{o.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h2 className="font-semibold">Low stock</h2>
          <ul className="mt-3 divide-y">
            {lowStock.length === 0 && <li className="py-3 text-sm text-neutral-500">All variants well stocked.</li>}
            {lowStock.map((v) => (
              <li key={v.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{v.product.title}</div>
                  <div className="text-neutral-500">{v.sku}</div>
                </div>
                <div className="text-right text-red-600 font-medium">{v.inventoryQty} left</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
