/**
 * WooCommerce Store API → Ascendyl product importer.
 *
 * Pulls products directly from a WooCommerce site's PUBLIC Store API.
 * No login or admin access required.
 *
 * Usage (from repo root):
 *   npm run import:woo-api -- --site=https://femfabs.com --dry-run
 *   npm run import:woo-api -- --site=https://femfabs.com --limit=10
 *   npm run import:woo-api -- --site=https://femfabs.com
 *   npm run import:woo-api -- --site=https://femfabs.com --status=ACTIVE --update
 *
 * Required env (in .env):
 *   DATABASE_URL=...                 # Neon Postgres
 *   CLOUDINARY_URL=cloudinary://...  # for image migration (skip with --skip-images)
 *
 * Notes:
 *  - The WooCommerce Store API at /wp-json/wc/store/v1/products is public
 *    by default on every modern WooCommerce install. No auth needed.
 *  - Variation pricing/SKU/stock isn't in the parent product summary, so
 *    each variation is fetched individually. Expect ~1 request per variant.
 *  - Same persistence guarantees as the CSV importer (idempotent on slug,
 *    --update to overwrite, images migrated to Cloudinary, etc.).
 */

import { prisma } from "../src/lib/prisma";
import { isCloudinaryEnabled } from "../src/lib/cloudinary";
import {
  persistProduct,
  stripHtml,
  type NormalizedProduct,
  type NormalizedVariant,
} from "./lib/woo-persist";

// ---------------- CLI ----------------

type Args = {
  site: string;
  dryRun: boolean;
  status: "DRAFT" | "ACTIVE";
  skipImages: boolean;
  update: boolean;
  limit: number | null;
  imagesPerProduct: number;
  perPage: number;
  startPage: number;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    opts[k] = v ?? true;
  }
  const site = ((opts.site as string) ?? "").replace(/\/$/, "");
  if (!site) {
    console.error("Missing --site=https://example.com");
    process.exit(1);
  }
  if (!/^https?:\/\//.test(site)) {
    console.error("--site must start with http:// or https://");
    process.exit(1);
  }
  const status = ((opts.status as string) ?? "DRAFT").toUpperCase();
  if (status !== "DRAFT" && status !== "ACTIVE") {
    console.error("--status must be DRAFT or ACTIVE");
    process.exit(1);
  }
  return {
    site,
    dryRun: !!opts["dry-run"],
    status: status as "DRAFT" | "ACTIVE",
    skipImages: !!opts["skip-images"],
    update: !!opts.update,
    limit: opts.limit ? Number(opts.limit) : null,
    imagesPerProduct: opts["images-per-product"]
      ? Math.max(1, Number(opts["images-per-product"]))
      : 8,
    perPage: opts["per-page"] ? Math.max(1, Number(opts["per-page"])) : 50,
    startPage: opts["start-page"] ? Math.max(1, Number(opts["start-page"])) : 1,
  };
}

// ---------------- Store API types (subset of what we use) ----------------

type ApiPrice = {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
};

type ApiImage = {
  id: number;
  src: string;
  alt: string | null;
};

type ApiAttributeTerm = {
  id: number;
  name: string;
  slug: string;
};

type ApiAttribute = {
  id: number;
  name: string;
  taxonomy: string | null;
  has_variations: boolean;
  terms: ApiAttributeTerm[];
};

type ApiVariationSummary = {
  id: number;
  attributes: Array<{ name: string; value: string }>;
};

type ApiCategory = { id: number; name: string; slug: string };
type ApiTag = { id: number; name: string; slug: string };

type ApiProduct = {
  id: number;
  parent: number;
  type: "simple" | "variable" | "grouped" | "external" | "variation";
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  description: string;
  short_description: string;
  on_sale: boolean;
  prices: ApiPrice;
  is_in_stock: boolean;
  is_purchasable: boolean;
  low_stock_remaining: number | null;
  images: ApiImage[];
  categories: ApiCategory[];
  tags: ApiTag[];
  attributes: ApiAttribute[];
  variations: ApiVariationSummary[];
};

// ---------------- HTTP helpers ----------------

async function getJson<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "ascendyl-importer/1.0" },
  });
  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const delay = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return getJson<T>(url, attempt + 1);
    }
    throw new Error(`GET ${url} → ${res.status}`);
  }
  return (await res.json()) as T;
}

async function fetchAllProducts(args: Args): Promise<{
  products: ApiProduct[];
  totalPages: number;
}> {
  const { site, perPage, startPage, limit } = args;
  const out: ApiProduct[] = [];
  let page = startPage;
  let totalPages = 1;

  while (true) {
    const url = `${site}/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}&orderby=date&order=desc`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "ascendyl-importer/1.0" },
    });
    if (!res.ok) {
      // page beyond total returns 400 with `rest_invalid_param`
      if (res.status === 400 && page > startPage) break;
      throw new Error(`GET ${url} → ${res.status}`);
    }
    const list = (await res.json()) as ApiProduct[];
    if (!Array.isArray(list) || list.length === 0) break;
    const tp = Number(res.headers.get("x-wp-totalpages") ?? "0");
    if (tp) totalPages = tp;
    out.push(...list);
    process.stdout.write(
      `\r→ Fetched page ${page}${tp ? `/${tp}` : ""} (${out.length} products)`,
    );
    if (limit && out.length >= limit) break;
    if (tp && page >= tp) break;
    page++;
  }
  process.stdout.write("\n");
  return { products: out, totalPages };
}

// ---------------- Mapping ----------------

function paiseFromMinor(value: string, minorUnit: number): number {
  // Store API gives amounts in minor units (e.g. INR has minorUnit=2,
  // so "99900" = ₹999.00 = 99900 paise). We always store in paise.
  // For currencies with minorUnit != 2 we convert proportionally.
  const n = Number(value || "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  if (minorUnit === 2) return Math.round(n);
  // normalise to 2 decimals
  return Math.round(n * Math.pow(10, 2 - minorUnit));
}

function buildSimpleVariant(p: ApiProduct, fallbackSku: string): NormalizedVariant {
  const reg = paiseFromMinor(p.prices.regular_price, p.prices.currency_minor_unit);
  const sale = paiseFromMinor(p.prices.sale_price, p.prices.currency_minor_unit);
  const onSale = p.on_sale && sale > 0 && sale < reg;
  return {
    sku: (p.sku || "").trim() || fallbackSku,
    price: onSale ? sale : reg,
    compareAtPrice: onSale ? reg : null,
    weightGrams: null,
    inventoryQty: p.is_in_stock ? p.low_stock_remaining ?? 100 : 0,
  };
}

function buildVariationVariant(
  parent: ApiProduct,
  varDetail: ApiProduct,
  summary: ApiVariationSummary,
  fallbackSku: string,
): NormalizedVariant {
  const reg = paiseFromMinor(
    varDetail.prices.regular_price,
    varDetail.prices.currency_minor_unit,
  );
  const sale = paiseFromMinor(
    varDetail.prices.sale_price,
    varDetail.prices.currency_minor_unit,
  );
  const onSale = varDetail.on_sale && sale > 0 && sale < reg;

  const opts = summary.attributes.slice(0, 3);
  return {
    sku: (varDetail.sku || "").trim() || fallbackSku,
    optionName1: opts[0]?.name,
    optionValue1: opts[0]?.value,
    optionName2: opts[1]?.name,
    optionValue2: opts[1]?.value,
    optionName3: opts[2]?.name,
    optionValue3: opts[2]?.value,
    price: onSale ? sale : reg || paiseFromMinor(parent.prices.regular_price, parent.prices.currency_minor_unit),
    compareAtPrice: onSale ? reg : null,
    weightGrams: null,
    inventoryQty: varDetail.is_in_stock ? varDetail.low_stock_remaining ?? 100 : 0,
  };
}

// ---------------- Main ----------------

async function main() {
  const args = parseArgs();

  if (!args.skipImages && !isCloudinaryEnabled()) {
    console.error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or pass --skip-images.",
    );
    process.exit(1);
  }

  console.log(`→ Source: ${args.site}/wp-json/wc/store/v1/products`);
  const { products } = await fetchAllProducts(args);
  let parents = products.filter(
    (p) => p.type === "simple" || p.type === "variable",
  );
  if (args.limit) parents = parents.slice(0, args.limit);
  console.log(
    `→ ${parents.length} parents (` +
      `${parents.filter((p) => p.type === "simple").length} simple, ` +
      `${parents.filter((p) => p.type === "variable").length} variable)`,
  );

  if (args.dryRun) {
    console.log("→ Dry run; printing summary of first 5 and exiting.");
    for (const p of parents.slice(0, 5)) {
      console.log(
        `  • ${p.type.padEnd(8)} id=${p.id}  sku="${p.sku}"  "${p.name}"  variations=${p.variations.length}`,
      );
    }
    process.exit(0);
  }

  let okCount = 0;
  let skipCount = 0;
  let errCount = 0;

  for (let idx = 0; idx < parents.length; idx++) {
    const p = parents[idx];
    const title = p.name.trim();
    try {
      // Variants
      const variants: NormalizedVariant[] = [];
      if (p.type === "simple") {
        variants.push(buildSimpleVariant(p, `${p.slug}-default`));
      } else {
        // Fetch each variation in series. Could be parallelised but keeping
        // it simple avoids overwhelming the source site.
        for (let i = 0; i < p.variations.length; i++) {
          const sum = p.variations[i];
          let detail: ApiProduct;
          try {
            detail = await getJson<ApiProduct>(
              `${args.site}/wp-json/wc/store/v1/products/${sum.id}`,
            );
          } catch (e: any) {
            console.warn(
              `  ! variation ${sum.id} fetch failed: ${e?.message ?? e}`,
            );
            continue;
          }
          variants.push(
            buildVariationVariant(p, detail, sum, `${p.slug}-v${i + 1}`),
          );
        }
        if (variants.length === 0) {
          variants.push(buildSimpleVariant(p, `${p.slug}-default`));
        }
      }

      const normalized: NormalizedProduct = {
        slug: p.slug || title,
        title,
        description:
          stripHtml(p.description) || stripHtml(p.short_description),
        tags: p.tags.map((t) => t.name).join(", ") || null,
        seoTitle: null,
        seoDescription: null,
        variants,
        imageUrls: p.images.map((i) => i.src).filter(Boolean),
        collectionTitles: p.categories.map((c) => c.name).filter(Boolean),
      };

      process.stdout.write(`[${idx + 1}/${parents.length}] ${title}…`);
      const res = await persistProduct(normalized, {
        status: args.status,
        update: args.update,
        skipImages: args.skipImages,
        imagesPerProduct: args.imagesPerProduct,
      });
      if (res.kind === "skipped") {
        process.stdout.write(` skip (${res.reason})\n`);
        skipCount++;
      } else {
        process.stdout.write(
          ` ✓ ${res.kind} variants=${variants.length} imgs=${res.imageCount}\n`,
        );
        okCount++;
      }
    } catch (e: any) {
      errCount++;
      console.error(
        `[${idx + 1}/${parents.length}] ERROR for "${title}":`,
        e?.message ?? e,
      );
    }
  }

  console.log("");
  console.log(`Done. ok=${okCount} skipped=${skipCount} errors=${errCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
