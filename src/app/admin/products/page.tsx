import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: { select: { price: true, inventoryQty: true } },
      images: { take: 1, orderBy: { position: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new">
          <Button>New product</Button>
        </Link>
      </div>

      <div className="mt-6 bg-white rounded-lg border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Inventory</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => {
              const minPrice = p.variants.length
                ? Math.min(...p.variants.map((v) => v.price))
                : 0;
              const totalQty = p.variants.reduce((acc, v) => acc + v.inventoryQty, 0);
              const img = p.images[0]?.url;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                          {p.title}
                        </Link>
                        <div className="text-xs text-neutral-500">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "ACTIVE"
                          ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
                          : "text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded text-xs"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatINR(minPrice)}</td>
                  <td className="px-4 py-3 text-right">{totalQty}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-sm underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
