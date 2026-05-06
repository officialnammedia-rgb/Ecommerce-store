/**
 * Shared persistence layer for product importers.
 *
 * Both `scripts/import-woo.ts` (WooCommerce CSV) and
 * `scripts/import-woo-api.ts` (WooCommerce Store API) normalise their
 * respective sources into a `NormalizedProduct` and call `persistProduct`
 * here, so we have one set of database writes to maintain.
 */

import path from "node:path";
import { prisma } from "../../src/lib/prisma";
import { uploadImageToCloudinary } from "../../src/lib/cloudinary";

// ---------------- Types ----------------

export type NormalizedVariant = {
  sku: string;
  optionName1?: string;
  optionValue1?: string;
  optionName2?: string;
  optionValue2?: string;
  optionName3?: string;
  optionValue3?: string;
  price: number; // paise
  compareAtPrice: number | null;
  weightGrams: number | null;
  inventoryQty: number;
};

export type NormalizedProduct = {
  /** Proposed slug; uniqueness is ensured for new products. */
  slug: string;
  title: string;
  description: string;
  tags: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: NormalizedVariant[];
  imageUrls: string[];
  collectionTitles: string[];
};

export type PersistOptions = {
  status: "DRAFT" | "ACTIVE";
  /** If true, existing products with the same slug are wiped + rewritten. */
  update: boolean;
  /** If true, skip image migration (faster trial runs). */
  skipImages: boolean;
  /** Max images per product to migrate. */
  imagesPerProduct: number;
};

export type PersistResult =
  | { kind: "created"; productId: string; imageCount: number }
  | { kind: "updated"; productId: string; imageCount: number }
  | { kind: "skipped"; reason: string };

// ---------------- Helpers ----------------

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "product"
  );
}

export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(\s)?/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
    candidate = `${base}-${i++}`;
  }
}

const collectionCache = new Map<string, string>();

async function ensureCollection(title: string): Promise<string> {
  const slug = slugify(title);
  const cached = collectionCache.get(slug);
  if (cached) return cached;
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) {
    collectionCache.set(slug, existing.id);
    return existing.id;
  }
  const created = await prisma.collection.create({ data: { slug, title } });
  collectionCache.set(slug, created.id);
  return created.id;
}

async function fetchBuffer(
  url: string,
): Promise<{ buf: Buffer; filename: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      console.warn(`  ! image fetch ${res.status} ${url}`);
      return null;
    }
    const ab = await res.arrayBuffer();
    const filename = path.basename(new URL(url).pathname) || "image.jpg";
    return { buf: Buffer.from(ab), filename };
  } catch (e: any) {
    console.warn(`  ! image fetch error ${url}: ${e?.message ?? e}`);
    return null;
  }
}

async function migrateImages(urls: string[], cap: number): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls.slice(0, cap)) {
    const got = await fetchBuffer(url);
    if (!got) continue;
    try {
      const secure = await uploadImageToCloudinary(got.buf, got.filename);
      out.push(secure);
    } catch (e: any) {
      console.warn(
        `  ! cloudinary upload failed for ${url}: ${e?.message ?? e}`,
      );
    }
  }
  return out;
}

// ---------------- Persist ----------------

export async function persistProduct(
  np: NormalizedProduct,
  opts: PersistOptions,
): Promise<PersistResult> {
  if (!np.title.trim()) return { kind: "skipped", reason: "empty title" };
  if (np.variants.length === 0)
    return { kind: "skipped", reason: "no variants" };

  const baseSlug = slugify(np.slug || np.title);
  const existing = await prisma.product.findUnique({
    where: { slug: baseSlug },
  });

  if (existing && !opts.update) {
    return { kind: "skipped", reason: "exists (pass --update to overwrite)" };
  }

  const slug = existing ? existing.slug : await uniqueSlug(baseSlug);

  // De-collide SKUs against the rest of the DB
  const variants = [...np.variants];
  for (const v of variants) {
    let candidate = v.sku;
    let n = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await prisma.productVariant.findUnique({
        where: { sku: candidate },
        select: { id: true, productId: true },
      });
      if (!clash || (existing && clash.productId === existing.id)) break;
      candidate = `${v.sku}-${n++}`;
    }
    v.sku = candidate;
  }

  // Migrate images first (network-heavy, do outside the txn)
  const migrated = !opts.skipImages
    ? await migrateImages(np.imageUrls, opts.imagesPerProduct)
    : [];

  // Resolve collections
  const collectionIds: string[] = [];
  for (const c of np.collectionTitles) {
    const t = c.trim();
    if (!t) continue;
    collectionIds.push(await ensureCollection(t));
  }

  // Persist in a single txn
  const productId = await prisma.$transaction(async (tx) => {
    let pid: string;
    if (existing) {
      await tx.productImage.deleteMany({ where: { productId: existing.id } });
      await tx.productVariant.deleteMany({ where: { productId: existing.id } });
      await tx.productOption.deleteMany({ where: { productId: existing.id } });
      await tx.collectionProduct.deleteMany({
        where: { productId: existing.id },
      });
      await tx.product.update({
        where: { id: existing.id },
        data: {
          title: np.title,
          description: np.description,
          tags: np.tags,
          status: opts.status,
          seoTitle: np.seoTitle,
          seoDescription: np.seoDescription,
        },
      });
      pid = existing.id;
    } else {
      const created = await tx.product.create({
        data: {
          slug,
          title: np.title,
          description: np.description,
          tags: np.tags,
          status: opts.status,
          seoTitle: np.seoTitle,
          seoDescription: np.seoDescription,
        },
      });
      pid = created.id;
    }

    // Options derived from variant option pairs
    const optionMap = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const [name, value] of [
        [v.optionName1, v.optionValue1],
        [v.optionName2, v.optionValue2],
        [v.optionName3, v.optionValue3],
      ] as Array<[string | undefined, string | undefined]>) {
        if (!name || !value) continue;
        const set = optionMap.get(name) ?? new Set<string>();
        set.add(value);
        optionMap.set(name, set);
      }
    }
    let optPos = 0;
    for (const [name, values] of optionMap.entries()) {
      await tx.productOption.create({
        data: {
          productId: pid,
          name,
          position: optPos++,
          values: { create: Array.from(values).map((vv) => ({ value: vv })) },
        },
      });
    }

    for (const v of variants) {
      await tx.productVariant.create({
        data: {
          productId: pid,
          sku: v.sku,
          optionName1: v.optionName1 ?? null,
          optionValue1: v.optionValue1 ?? null,
          optionName2: v.optionName2 ?? null,
          optionValue2: v.optionValue2 ?? null,
          optionName3: v.optionName3 ?? null,
          optionValue3: v.optionValue3 ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          weightGrams: v.weightGrams,
          inventoryQty: v.inventoryQty,
        },
      });
    }

    for (let i = 0; i < migrated.length; i++) {
      await tx.productImage.create({
        data: {
          productId: pid,
          url: migrated[i],
          alt: np.title,
          position: i,
        },
      });
    }

    for (let i = 0; i < collectionIds.length; i++) {
      await tx.collectionProduct.create({
        data: {
          productId: pid,
          collectionId: collectionIds[i],
          position: i,
        },
      });
    }

    return pid;
  });

  return existing
    ? { kind: "updated", productId, imageCount: migrated.length }
    : { kind: "created", productId, imageCount: migrated.length };
}
