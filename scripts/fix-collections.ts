/**
 * One-shot collection cleanup for the Ascendyl storefront.
 *
 * What this fixes:
 *   1. Every men's product is in the `men` collection
 *   2. Every women's product is in the `women` collection
 *   3. Every product is in the `all` collection (used by /collections/all)
 *   4. The newest 50 products are in the `new` collection
 *   5. ~100 products are marked as on-sale: a compareAtPrice strictly higher
 *      than the variant price is set on each variant, and the product is added
 *      to the `sale` collection. Distribution: 50 @ 20% off, 30 @ 30% off,
 *      20 @ 50% off, so the homepage / sale page show a healthy mix.
 *
 * Heuristics:
 *   - "Men's" products are identified by either:
 *       a) any variant SKU starting with `ASC-` (the prefix used by the
 *          generate-men-catalog script), or
 *       b) slug starting with `men-` (defensive fallback).
 *   - Everything else is considered "women's" (the femfabs WooCommerce import).
 *
 * Idempotent: safe to re-run. Existing collection links are preserved; only
 * missing links are added. Sale prices are only set on products that don't
 * already have an existing compareAtPrice (so we don't trample real sales).
 *
 * Usage:
 *   npm run fix:collections             # run it
 *   npm run fix:collections -- --dry    # report only, no writes
 */

import { prisma } from "../src/lib/prisma";

const DRY = process.argv.includes("--dry");

async function ensureCollection(slug: string, title: string) {
  return prisma.collection.upsert({
    where: { slug },
    update: {},
    create: { slug, title },
  });
}

async function addToCollection(productId: string, collectionId: string) {
  // Composite unique on (collectionId, productId) lets us upsert safely.
  await prisma.collectionProduct.upsert({
    where: { collectionId_productId: { collectionId, productId } },
    update: {},
    create: { collectionId, productId, position: 0 },
  });
}

function isMensSku(sku: string | null | undefined, slug: string) {
  return (sku ?? "").startsWith("ASC-") || slug.startsWith("men-");
}

async function main() {
  console.log(`\nFix collections — dryRun=${DRY}\n`);

  const [men, women, all, sale, neu] = await Promise.all([
    ensureCollection("men", "Men"),
    ensureCollection("women", "Women"),
    ensureCollection("all", "All"),
    ensureCollection("sale", "Sale"),
    ensureCollection("new", "New Arrivals"),
  ]);

  // --- Pull every product with a representative variant SKU and current
  //     collection memberships, so we can decide what to add. ---
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      createdAt: true,
      variants: {
        select: { id: true, sku: true, price: true, compareAtPrice: true },
        orderBy: { id: "asc" },
      },
      collections: { select: { collectionId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total products: ${products.length}`);

  let mensCount = 0;
  let womensCount = 0;
  let toMen = 0;
  let toWomen = 0;
  let toAll = 0;
  let toNew = 0;

  for (const p of products) {
    const firstSku = p.variants[0]?.sku;
    const isMen = isMensSku(firstSku, p.slug);
    if (isMen) mensCount++;
    else womensCount++;

    const inIds = new Set(p.collections.map((c) => c.collectionId));

    if (isMen && !inIds.has(men.id)) {
      toMen++;
      if (!DRY) await addToCollection(p.id, men.id);
    }
    if (!isMen && !inIds.has(women.id)) {
      toWomen++;
      if (!DRY) await addToCollection(p.id, women.id);
    }
    if (!inIds.has(all.id)) {
      toAll++;
      if (!DRY) await addToCollection(p.id, all.id);
    }
  }

  console.log(`\nClassification:`);
  console.log(`  men:   ${mensCount}`);
  console.log(`  women: ${womensCount}`);
  console.log(`\nLinks added (this run):`);
  console.log(`  + men:   ${toMen}`);
  console.log(`  + women: ${toWomen}`);
  console.log(`  + all:   ${toAll}`);

  // --- New Arrivals: top 50 most recently created products ---
  const newest = products.slice(0, 50);
  for (const p of newest) {
    const inIds = new Set(p.collections.map((c) => c.collectionId));
    if (!inIds.has(neu.id)) {
      toNew++;
      if (!DRY) await addToCollection(p.id, neu.id);
    }
  }
  console.log(`  + new:   ${toNew}  (top 50 newest)`);

  // --- Sale: pick 100 products spanning men + women, assign tiered discounts ---
  // Pick deterministically (every Nth product) so re-runs are stable. We mix
  // men's and women's SKUs so the Sale page doesn't look gendered.
  const target = Math.min(100, products.length);
  const step = Math.max(1, Math.floor(products.length / target));
  const saleCandidates: typeof products = [];
  for (let i = 0; i < products.length && saleCandidates.length < target; i += step) {
    saleCandidates.push(products[i]);
  }

  // Tier distribution
  const tiers = [
    { count: 50, percent: 20 },
    { count: 30, percent: 30 },
    { count: 20, percent: 50 },
  ];

  let saleApplied = 0;
  let variantsUpdated = 0;
  let toSale = 0;
  let cursor = 0;

  for (const tier of tiers) {
    for (let i = 0; i < tier.count && cursor < saleCandidates.length; i++, cursor++) {
      const p = saleCandidates[cursor];
      const inIds = new Set(p.collections.map((c) => c.collectionId));

      // Compute new compareAtPrice as price / (1 - percent/100), rounded to 99-paise.
      // i.e. the original "list" price was higher; now it's discounted to
      // current price, which is `percent` lower than compareAtPrice.
      // compareAtPrice = price / (1 - percent/100)
      for (const v of p.variants) {
        if (v.compareAtPrice && v.compareAtPrice > v.price) {
          // Already on sale (real or pre-existing) — don't trample.
          continue;
        }
        const factor = 1 - tier.percent / 100;
        // Round up to nearest ₹100 (= 10000 paise) for clean prices like 1999/2499.
        const raw = Math.ceil(v.price / factor / 10000) * 10000;
        // Snap final two paise to "99" for the classic ₹X99 look (e.g. 1999, 2499).
        const newCompare = raw - 100; // i.e. 2000_00 → 1999_00
        if (!DRY) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { compareAtPrice: newCompare },
          });
        }
        variantsUpdated++;
      }

      if (!inIds.has(sale.id)) {
        toSale++;
        if (!DRY) await addToCollection(p.id, sale.id);
      }
      saleApplied++;
    }
  }

  console.log(`  + sale:  ${toSale}  (products) — ${variantsUpdated} variants priced (across ${saleApplied} products)`);

  // --- Final collection counts ---
  const cols = await prisma.collection.findMany({
    select: { slug: true, title: true, _count: { select: { products: true } } },
    orderBy: { title: "asc" },
  });
  console.log(`\n=== Final collection counts ===`);
  for (const c of cols) {
    console.log(`  ${c.slug.padEnd(30)} ${String(c._count.products).padStart(4)} products`);
  }

  console.log(`\n${DRY ? "(dry run — no writes performed)" : "Done."}\n`);
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
