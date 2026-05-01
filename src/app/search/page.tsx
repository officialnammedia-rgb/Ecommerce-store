import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const products = q
    ? await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        take: 24,
        include: {
          variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
          images: { take: 1, orderBy: { position: "asc" } },
        },
      })
    : [];

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-semibold">Search</h1>
      <form className="mt-4 max-w-md">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          autoFocus
        />
      </form>
      {q && (
        <p className="mt-3 text-sm text-neutral-500">
          {products.length} result{products.length === 1 ? "" : "s"} for &quot;{q}&quot;
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {q && products.length === 0 && (
          <p className="col-span-full text-neutral-500">
            No products found.{" "}
            <Link href="/collections/all" className="underline">
              Browse all
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
