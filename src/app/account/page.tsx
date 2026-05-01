import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { SignOutButton } from "@/components/site/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="container py-10 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {session.user.name ?? session.user.email}</h1>
          <p className="text-sm text-neutral-600">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/account/profile"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 transition"
        >
          <p className="text-sm font-semibold">Profile & security</p>
          <p className="text-xs text-neutral-500 mt-1">Update name, change password</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 transition"
        >
          <p className="text-sm font-semibold">Addresses</p>
          <p className="text-xs text-neutral-500 mt-1">Saved shipping addresses</p>
        </Link>
        <Link
          href="/account/wishlist"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 transition"
        >
          <p className="text-sm font-semibold">Wishlist</p>
          <p className="text-xs text-neutral-500 mt-1">Pieces you love, saved</p>
        </Link>
        <Link
          href="/pages/contact"
          className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 transition"
        >
          <p className="text-sm font-semibold">Help</p>
          <p className="text-xs text-neutral-500 mt-1">Contact support, FAQ</p>
        </Link>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Recent orders</h2>
      <div className="mt-3 bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <Link href={`/account/orders/${o.id}`} className="font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 text-right">{formatINR(o.grandTotal)}</td>
                <td className="px-4 py-3 text-right">{o.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                  No orders yet.{" "}
                  <Link href="/collections/all" className="underline">
                    Start shopping
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
