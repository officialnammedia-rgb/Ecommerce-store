import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Truck, RotateCcw, ShieldCheck, BadgeIndianRupee } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VariantPicker } from "@/components/storefront/VariantPicker";
import { WishlistButton } from "@/components/storefront/WishlistButton";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductCard } from "@/components/storefront/ProductCard";
import { PincodeChecker } from "@/components/storefront/PincodeChecker";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { StarRating } from "@/components/ui/StarRating";
import { isFavorited } from "@/lib/wishlist";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/utils";

// ISR: cache product pages for 60s. Inventory/reviews lag by at most 1 minute;
// good enough for a launch-size catalog and massively faster than hitting DB
// on every visitor click.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true, seoTitle: true, seoDescription: true },
  });
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      collections: { include: { collection: true } },
    },
  });
  if (!product || product.status !== "ACTIVE") notFound();

  const minPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.price))
    : 0;
  const maxCompareAt =
    product.variants
      .map((v) => v.compareAtPrice ?? 0)
      .reduce((a, b) => Math.max(a, b), 0) || null;

  const totalStock = product.variants.reduce((acc, v) => acc + v.inventoryQty, 0);

  // Related products: same collection(s), or fallback to latest
  const relatedCollectionIds = product.collections.map((c) => c.collectionId);
  const related = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: product.id },
      ...(relatedCollectionIds.length
        ? { collections: { some: { collectionId: { in: relatedCollectionIds } } } }
        : {}),
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
      images: { take: 1, orderBy: { position: "asc" } },
    },
  });

  const primaryCollection = product.collections[0]?.collection;
  const breadcrumbHref = primaryCollection
    ? `/collections/${primaryCollection.slug}`
    : "/collections/all";
  const breadcrumbLabel = primaryCollection?.title ?? "All";

  // Real review aggregate
  const reviewAgg = await prisma.review.aggregate({
    where: { productId: product.id, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const reviewAvg = reviewAgg._avg.rating ?? 0;
  const reviewCount = reviewAgg._count._all ?? 0;

  const session = await getSession();
  const signedInUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku ?? undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: minPrice / 100,
      offerCount: product.variants.length,
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
  if (reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewAvg.toFixed(1),
      reviewCount,
    };
  }

  return (
    <div>
      {/* Breadcrumb bar */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="container py-3 text-xs text-neutral-600 flex items-center gap-1.5">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href={breadcrumbHref} className="hover:underline">
            {breadcrumbLabel}
          </Link>
          <span>/</span>
          <span className="text-neutral-900 truncate">{product.title}</span>
        </div>
      </div>

      <div className="container py-8 grid lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Gallery */}
        <ProductGallery
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
          title={product.title}
        />

        {/* Detail column */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <div>
            {primaryCollection && (
              <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold">
                {primaryCollection.title}
              </p>
            )}
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold leading-tight">
              {product.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
              {reviewCount > 0 ? (
                <>
                  <StarRating value={reviewAvg} size={14} />
                  <a href="#reviews" className="hover:underline">
                    {reviewAvg.toFixed(1)} · {reviewCount}{" "}
                    {reviewCount === 1 ? "review" : "reviews"}
                  </a>
                </>
              ) : (
                <a href="#reviews" className="hover:underline text-neutral-500">
                  Be the first to review
                </a>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-neutral-700 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <VariantPicker variants={product.variants} />
            </div>
            <WishlistButton
              productId={product.id}
              initialFavorited={isFavorited(product.id)}
            />
          </div>

          <PincodeChecker />

          {/* Trust strip */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <TrustItem icon={Truck} title="Free shipping" sub="Orders above ₹999" />
            <TrustItem icon={RotateCcw} title="Easy returns" sub="7-day window" />
            <TrustItem icon={BadgeIndianRupee} title="Cash on delivery" sub="Available" />
            <TrustItem icon={ShieldCheck} title="Secure checkout" sub="100% safe" />
          </div>

          {/* Accordions */}
          <div className="border-t pt-2">
            <Accordion title="Product details" defaultOpen>
              <ul className="space-y-1 list-disc pl-5">
                <li>SKU: {product.variants[0]?.sku ?? "—"}</li>
                <li>{product.variants.length} variants available</li>
                {maxCompareAt && minPrice < maxCompareAt && (
                  <li>
                    Save up to{" "}
                    <strong className="text-green-700">
                      {Math.round(((maxCompareAt - minPrice) / maxCompareAt) * 100)}%
                    </strong>
                  </li>
                )}
                <li>From {formatINR(minPrice)}</li>
              </ul>
            </Accordion>
            <Accordion title="Shipping & returns">
              <p>
                Free shipping across India on orders above ₹999. Standard delivery in 3–7
                business days. 7-day easy returns on unworn items with tags intact. COD
                available pan-India.
              </p>
            </Accordion>
            <Accordion title="Care instructions">
              <p>
                Machine wash cold with similar colours. Do not bleach. Iron on low. Tumble
                dry low or hang to dry. Refer to label for fabric-specific instructions.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="container">
        <ProductReviews productId={product.id} signedInUserId={signedInUserId} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="container py-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">You may also like</h2>
            <Link href={breadcrumbHref} className="text-sm underline">
              View more →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-neutral-200 px-3 py-2.5">
      <Icon className="h-4 w-4 mt-0.5 text-neutral-700" />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}

function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-neutral-200 py-3" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm">
        <span>{title}</span>
        <span className="text-neutral-500 group-open:rotate-45 transition-transform text-lg leading-none">
          +
        </span>
      </summary>
      <div className="mt-3 text-sm text-neutral-700 leading-relaxed">{children}</div>
    </details>
  );
}
