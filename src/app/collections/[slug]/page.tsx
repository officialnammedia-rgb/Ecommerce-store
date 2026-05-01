import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CollectionToolbar } from "@/components/storefront/CollectionToolbar";
import {
  parseFilters,
  variantWhere,
  productOrderBy,
  fetchFacets,
  applyPriceSort,
} from "@/lib/filters";

export const dynamic = "force-dynamic";

const HEROES: Record<string, { title: string; subtitle: string; image: string }> = {
  all: {
    title: "All products",
    subtitle: "Every piece, all at once.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
  },
  new: {
    title: "New arrivals",
    subtitle: "Fresh pieces, just dropped.",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1600&q=80",
  },
  women: {
    title: "Women",
    subtitle: "Effortless silhouettes for every day.",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
  },
  men: {
    title: "Men",
    subtitle: "Sharp, easy, every-occasion.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&q=80",
  },
  sale: {
    title: "Sale",
    subtitle: "Up to 60% off — while sizes last.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
  },
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const isAll = params.slug === "all";

  let title = "All products";
  let description: string | null = null;
  let productIds: string[] | null = null;

  if (!isAll) {
    const collection = await prisma.collection.findUnique({
      where: { slug: params.slug },
      include: { products: { orderBy: { position: "asc" }, select: { productId: true } } },
    });
    if (!collection) notFound();
    title = collection.title;
    description = collection.description;
    productIds = collection.products.map((p) => p.productId);
  }

  const filters = parseFilters(searchParams);

  const productScope = {
    status: "ACTIVE",
    ...(productIds ? { id: { in: productIds } } : {}),
  };

  const variantConstraints = variantWhere(filters);
  const hasVariantConstraints = Object.keys(variantConstraints).length > 0;

  const where = {
    ...productScope,
    ...(hasVariantConstraints ? { variants: { some: variantConstraints } } : {}),
  };

  const [products, totalCount, facets] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: productOrderBy(filters),
      include: {
        variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
    }),
    prisma.product.count({ where }),
    fetchFacets(productScope),
  ]);

  const sortedProducts = applyPriceSort(products, filters);

  const hero = HEROES[params.slug] ?? {
    title,
    subtitle: description ?? "",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
  };

  return (
    <div>
      {/* Hero / banner */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.image}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
        <div className="container relative h-full flex flex-col justify-end pb-8 text-white">
          <nav className="text-xs opacity-80">
            <Link href="/" className="hover:underline">
              Home
            </Link>{" "}
            / <span className="capitalize">{title}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-semibold mt-1">{title}</h1>
          {hero.subtitle && (
            <p className="mt-2 max-w-xl text-sm md:text-base text-white/85">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      <div className="container py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <div>
          {/* Toolbar handles its own sidebar/drawer rendering */}
          <CollectionToolbar facets={facets} totalCount={totalCount} />
        </div>
        <div>
          {sortedProducts.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <p className="text-neutral-500">No products match these filters.</p>
              <Link href={`/collections/${params.slug}`} className="text-sm underline mt-2 inline-block">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
