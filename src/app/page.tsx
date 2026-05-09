import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { HeroCarousel, type HeroSlide } from "@/components/storefront/HeroCarousel";
import { CategoryCircles } from "@/components/storefront/CategoryCircles";
import { PromoTiles } from "@/components/storefront/PromoTiles";
import { ValueProps } from "@/components/storefront/ValueProps";
import { LookbookStrip } from "@/components/storefront/LookbookStrip";
import { Newsletter } from "@/components/storefront/Newsletter";
import { OrgJsonLd } from "@/components/site/JsonLd";

// ISR: rebuild the homepage at most once per minute, serve a cached HTML
// otherwise. Admin edits show up within 60s. This cuts the visitor's page
// load from ~1s (cold DB) down to ~100ms (cached HTML from Vercel's edge).
export const revalidate = 60;

const heroSlides: HeroSlide[] = [
  {
    eyebrow: "New Season · Spring 2026",
    title: "Effortless style, made for everyday.",
    subtitle:
      "Curated pieces in breathable fabrics. Designed in India, made to move with you.",
    ctaText: "Shop new arrivals",
    ctaHref: "/collections/new",
    secondaryText: "Browse all",
    secondaryHref: "/collections/all",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
    accent: "bg-neutral-50",
  },
  {
    eyebrow: "Up to 60% off",
    title: "Mid-season sale starts now.",
    subtitle: "Top picks across women & men. Prices that pair perfectly with your fits.",
    ctaText: "Shop the sale",
    ctaHref: "/collections/sale",
    secondaryText: "View edits",
    secondaryHref: "/collections/all",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
    accent: "bg-rose-50",
  },
  {
    eyebrow: "Festive Edit",
    title: "Statement looks for the season.",
    subtitle: "Standout silhouettes, modern textures, festive ready.",
    ctaText: "Shop women",
    ctaHref: "/collections/women",
    secondaryText: "Shop men",
    secondaryHref: "/collections/men",
    image: "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=1600&q=80",
    accent: "bg-neutral-900",
    textOnDark: true,
  },
];

const categoryCircles = [
  { title: "New", href: "/collections/new", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80" },
  { title: "Women", href: "/collections/women", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80" },
  { title: "Men", href: "/collections/men", image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400&q=80" },
  { title: "Tees", href: "/search?q=tee", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { title: "Denim", href: "/search?q=jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
  { title: "Sale", href: "/collections/sale", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
];

const promoTiles = [
  {
    badge: "New",
    subtitle: "Spring drop",
    title: "Easy linen shirts",
    cta: "Shop now",
    href: "/search?q=linen",
    image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=900&q=80",
  },
  {
    badge: "Best seller",
    subtitle: "Everyday cotton",
    title: "The essential tee",
    cta: "Shop tees",
    href: "/search?q=tee",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&q=80",
  },
  {
    badge: "Limited",
    subtitle: "Sale picks",
    title: "Up to 40% off dresses",
    cta: "Explore sale",
    href: "/collections/sale",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80",
  },
];

export default async function HomePage() {
  const [latest, bestsellers] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: {
        variants: { select: { price: true, compareAtPrice: true, inventoryQty: true } },
        images: { take: 1, orderBy: { position: "asc" } },
      },
    }),
  ]);

  return (
    <div>
      <OrgJsonLd />
      <AnnouncementBar />
      <HeroCarousel slides={heroSlides} />

      <CategoryCircles items={categoryCircles} />

      <PromoTiles tiles={promoTiles} />

      <section className="container pb-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-accent">Just in</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold">New arrivals</h2>
          </div>
          <Link href="/collections/new" className="text-sm underline">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <ValueProps />

      <LookbookStrip />

      <section className="container py-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-accent">Loved by you</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold">Bestsellers</h2>
          </div>
          <Link href="/collections/all" className="text-sm underline">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
