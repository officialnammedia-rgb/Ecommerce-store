import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  ProductsTable,
  type AdminProductRow,
} from "@/components/admin/ProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: { select: { price: true, inventoryQty: true } },
      images: { take: 1, orderBy: { position: "asc" } },
    },
  });

  const rows: AdminProductRow[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status as AdminProductRow["status"],
    minPrice: p.variants.length
      ? Math.min(...p.variants.map((v) => v.price))
      : 0,
    totalQty: p.variants.reduce((acc, v) => acc + v.inventoryQty, 0),
    imageUrl: p.images[0]?.url ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new">
          <Button>New product</Button>
        </Link>
      </div>

      <ProductsTable products={rows} />
    </div>
  );
}
