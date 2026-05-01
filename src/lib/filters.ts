import { prisma } from "@/lib/prisma";

// Loose Prisma types kept minimal to avoid namespace import on this project.
type ProductWhere = Record<string, unknown>;
type VariantWhere = Record<string, unknown>;
type ProductOrderBy = Record<string, "asc" | "desc">;

export type ParsedFilters = {
  sort: "newest" | "price_asc" | "price_desc" | "name_asc";
  sizes: string[];
  colors: string[];
  min: number | null;
  max: number | null;
  inStock: boolean;
};

export function parseFilters(searchParams: Record<string, string | string[] | undefined>): ParsedFilters {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const splitMulti = (s: string | undefined) =>
    s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

  const sortRaw = get("sort") ?? "newest";
  const sort: ParsedFilters["sort"] =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "name_asc"
      ? sortRaw
      : "newest";

  return {
    sort,
    sizes: splitMulti(get("size")),
    colors: splitMulti(get("color")),
    min: get("min") ? Math.max(0, parseInt(get("min")!, 10)) : null,
    max: get("max") ? Math.max(0, parseInt(get("max")!, 10)) : null,
    inStock: get("inStock") === "1",
  };
}

/** Build a Prisma `where` for products that have at least one variant matching the filters. */
export function variantWhere(f: ParsedFilters): VariantWhere {
  const w: VariantWhere = {};
  if (f.inStock) w.inventoryQty = { gt: 0 };
  if (f.min != null || f.max != null) {
    // Filters use rupees, prices are stored in paise.
    const price: Record<string, number> = {};
    if (f.min != null) price.gte = f.min * 100;
    if (f.max != null) price.lte = f.max * 100;
    w.price = price;
  }
  const optionFilters: VariantWhere[] = [];
  if (f.sizes.length) {
    optionFilters.push({
      OR: [
        { optionValue1: { in: f.sizes } },
        { optionValue2: { in: f.sizes } },
        { optionValue3: { in: f.sizes } },
      ],
    });
  }
  if (f.colors.length) {
    optionFilters.push({
      OR: [
        { optionValue1: { in: f.colors } },
        { optionValue2: { in: f.colors } },
        { optionValue3: { in: f.colors } },
      ],
    });
  }
  if (optionFilters.length) w.AND = optionFilters;
  return w;
}

export function productOrderBy(f: ParsedFilters): ProductOrderBy {
  switch (f.sort) {
    case "name_asc":
      return { title: "asc" };
    case "price_asc":
    case "price_desc":
      // Sort products by their first variant's price via a stable proxy: createdAt fallback.
      // Real price-based sort requires sorting by min(variant.price); we approximate by post-fetch sort.
      return { createdAt: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function fetchFacets(productScope: ProductWhere) {
  const variants = await prisma.productVariant.findMany({
    where: { product: productScope },
    select: {
      optionName1: true,
      optionValue1: true,
      optionName2: true,
      optionValue2: true,
      optionName3: true,
      optionValue3: true,
      price: true,
    },
  });

  const sizes = new Set<string>();
  const colors = new Set<string>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const v of variants) {
    const triples = [
      [v.optionName1, v.optionValue1],
      [v.optionName2, v.optionValue2],
      [v.optionName3, v.optionValue3],
    ] as const;
    for (const [n, val] of triples) {
      if (!n || !val) continue;
      const lower = n.toLowerCase();
      if (lower === "size") sizes.add(val);
      else if (lower === "color" || lower === "colour") colors.add(val);
    }
    if (v.price < priceMin) priceMin = v.price;
    if (v.price > priceMax) priceMax = v.price;
  }

  // Sort sizes by clothing convention if recognizable
  const ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const sizeArr = [...sizes].sort((a, b) => {
    const ai = ORDER.indexOf(a.toUpperCase());
    const bi = ORDER.indexOf(b.toUpperCase());
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return {
    sizes: sizeArr,
    colors: [...colors].sort(),
    priceMin: priceMin === Infinity ? 0 : Math.floor(priceMin / 100),
    priceMax: Math.ceil(priceMax / 100),
  };
}

/** Sort products in memory by minimum variant price for price_asc / price_desc. */
export function applyPriceSort<T>(products: T[], f: ParsedFilters): T[] {
  if (f.sort !== "price_asc" && f.sort !== "price_desc") return products;
  const minPrice = (p: T) => {
    const variants = (p as unknown as { variants?: { price: number }[] }).variants ?? [];
    return variants.length ? Math.min(...variants.map((v) => v.price)) : 0;
  };
  const sorted = [...products].sort((a, b) => minPrice(a) - minPrice(b));
  return f.sort === "price_desc" ? sorted.reverse() : sorted;
}
