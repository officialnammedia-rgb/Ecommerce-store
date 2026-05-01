import Link from "next/link";
import { formatINR } from "@/lib/utils";

type Variant = { price: number; compareAtPrice: number | null; inventoryQty: number };
type Image = { url: string; alt: string | null };
type Product = {
  id: string;
  slug: string;
  title: string;
  variants: Variant[];
  images: Image[];
};

export function ProductCard({ product }: { product: Product }) {
  const minPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.price))
    : 0;
  const compareAt = product.variants.length
    ? Math.max(...product.variants.map((v) => v.compareAtPrice ?? 0))
    : 0;
  const onSale = compareAt > minPrice && minPrice > 0;
  const img = product.images[0]?.url;
  const inStock = product.variants.some((v) => v.inventoryQty > 0);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] bg-neutral-100 rounded-md overflow-hidden relative">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.images[0]?.alt ?? product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : null}
        {!inStock && (
          <span className="absolute top-2 left-2 bg-white text-xs px-2 py-0.5 rounded">
            Sold out
          </span>
        )}
        {onSale && inStock && (
          <span className="absolute top-2 left-2 bg-brand-accent text-white text-xs px-2 py-0.5 rounded">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium line-clamp-1">{product.title}</p>
        <div className="text-sm text-neutral-700 flex gap-2">
          <span>{formatINR(minPrice)}</span>
          {onSale && <span className="text-neutral-400 line-through">{formatINR(compareAt)}</span>}
        </div>
      </div>
    </Link>
  );
}
