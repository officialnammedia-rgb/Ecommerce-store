import Link from "next/link";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { readFavoriteIds } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const ids = readFavoriteIds();

  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids }, status: "ACTIVE" },
        include: {
          variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
          images: { take: 1, orderBy: { position: "asc" } },
        },
      })
    : [];

  // Preserve order of cookie list
  const ordered = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-brand-accent" />
        <h1 className="text-2xl md:text-3xl font-semibold">Your wishlist</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Saved on this device. Pieces you love, in one place.
      </p>

      {ordered.length === 0 ? (
        <div className="mt-10 border border-dashed rounded-lg p-12 text-center">
          <p className="text-neutral-500">Your wishlist is empty.</p>
          <Link
            href="/collections/all"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-neutral-800"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
          {ordered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
