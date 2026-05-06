/**
 * WooCommerce CSV → Ascendyl product importer.
 *
 * Use this when you have access to the WordPress admin and can do
 * Products → Export. If you don't have admin access, use the API-based
 * importer instead: `npm run import:woo-api`.
 *
 * Usage (from repo root):
 *   npm run import:woo -- --file=./imports/femfabs.csv --dry-run
 *   npm run import:woo -- --file=./imports/femfabs.csv --status=DRAFT
 *   npm run import:woo -- --file=./imports/femfabs.csv --status=ACTIVE --limit=20
 *   npm run import:woo -- --file=./imports/femfabs.csv --skip-images
 *   npm run import:woo -- --file=./imports/femfabs.csv --update
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
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
  file: string;
  dryRun: boolean;
  status: "DRAFT" | "ACTIVE";
  skipImages: boolean;
  update: boolean;
  limit: number | null;
  imagesPerProduct: number;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    opts[k] = v ?? true;
  }
  const file = (opts.file as string) ?? "";
  if (!file) {
    console.error("Missing --file=path/to/woo-export.csv");
    process.exit(1);
  }
  const status = ((opts.status as string) ?? "DRAFT").toUpperCase();
  if (status !== "DRAFT" && status !== "ACTIVE") {
    console.error("--status must be DRAFT or ACTIVE");
    process.exit(1);
  }
  return {
    file: path.resolve(file),
    dryRun: !!opts["dry-run"],
    status: status as "DRAFT" | "ACTIVE",
    skipImages: !!opts["skip-images"],
    update: !!opts.update,
    limit: opts.limit ? Number(opts.limit) : null,
    imagesPerProduct: opts["images-per-product"]
      ? Math.max(1, Number(opts["images-per-product"]))
      : 8,
  };
}

// ---------------- CSV helpers ----------------

function toPaise(decimalStr: string | undefined | null): number | null {
  if (!decimalStr) return null;
  const n = Number(String(decimalStr).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function toInt(s: string | undefined | null, fallback = 0): number {
  if (s == null || s === "") return fallback;
  const n = Number(String(s).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function leafCategory(raw: string): string {
  const parts = raw.split(">").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? raw.trim();
}

function splitCsvList(s: string | undefined | null): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function splitPipeList(s: string | undefined | null): string[] {
  if (!s) return [];
  return s.split("|").map((x) => x.trim()).filter(Boolean);
}

function readAttributes(
  row: Record<string, string>,
): Array<{ name: string; values: string[] }> {
  const out: Array<{ name: string; values: string[] }> = [];
  for (let i = 1; i <= 3; i++) {
    const name = (row[`Attribute ${i} name`] ?? "").trim();
    const valuesRaw = (row[`Attribute ${i} value(s)`] ?? "").trim();
    if (!name || !valuesRaw) continue;
    out.push({ name, values: splitPipeList(valuesRaw) });
  }
  return out;
}

// ---------------- Importer ----------------

type Row = Record<string, string>;

type Item = {
  type: "simple" | "variable";
  row: Row;
  variations: Row[];
};

async function main() {
  const args = parseArgs();

  if (!args.skipImages && !isCloudinaryEnabled()) {
    console.error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or pass --skip-images.",
    );
    process.exit(1);
  }

  console.log(`→ Reading ${args.file}`);
  const csv = readFileSync(args.file);
  const rows: Row[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  });
  console.log(`→ ${rows.length} CSV rows`);

  // Group: variation rows attach to their parent SKU.
  const variationsByParent = new Map<string, Row[]>();
  for (const r of rows) {
    if ((r.Type ?? "").toLowerCase().trim() !== "variation") continue;
    const parent = (r.Parent ?? "").trim();
    const list = variationsByParent.get(parent) ?? [];
    list.push(r);
    variationsByParent.set(parent, list);
  }

  const items: Item[] = [];
  for (const r of rows) {
    const type = (r.Type ?? "").toLowerCase().trim();
    if (type !== "simple" && type !== "variable") continue;
    if ((r.Published ?? "1").trim() === "-1") continue; // trashed
    const sku = (r.SKU ?? "").trim();
    const variations =
      type === "variable" ? variationsByParent.get(sku) ?? [] : [];
    items.push({ type: type as "simple" | "variable", row: r, variations });
  }

  console.log(
    `→ ${items.length} parent products (` +
      `${items.filter((i) => i.type === "simple").length} simple, ` +
      `${items.filter((i) => i.type === "variable").length} variable)`,
  );

  if (args.limit) {
    items.splice(args.limit);
    console.log(`→ Limit applied: importing first ${items.length}`);
  }

  if (args.dryRun) {
    console.log("→ Dry run; printing summary and exiting.");
    for (const it of items.slice(0, 5)) {
      console.log(
        `  • ${it.type.padEnd(8)} ${it.row.SKU ?? "(no-sku)"}  "${it.row.Name}"  variations=${it.variations.length}`,
      );
    }
    process.exit(0);
  }

  let okCount = 0;
  let skipCount = 0;
  let errCount = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const r = it.row;
    const title = (r.Name ?? "").trim();
    if (!title) {
      skipCount++;
      continue;
    }

    try {
      // Build variants
      const variants: NormalizedVariant[] = [];
      const buildVariant = (vr: Row, fallbackSku: string): NormalizedVariant => {
        const reg = toPaise(vr["Regular price"]);
        const sale = toPaise(vr["Sale price"]);
        const parentReg = toPaise(r["Regular price"]);
        const price = sale ?? reg ?? parentReg ?? 0;
        const compareAt = sale && reg ? reg : null;
        const weightKg = Number(vr["Weight (kg)"] ?? "");
        const weightGrams =
          Number.isFinite(weightKg) && weightKg > 0
            ? Math.round(weightKg * 1000)
            : null;
        const stock = toInt(vr.Stock, 0);
        const inStockFlag = (vr["In stock?"] ?? "").trim();
        const inventoryQty =
          stock > 0 ? stock : inStockFlag === "1" ? 10 : 0;
        const attrs = readAttributes(vr);
        const sku = (vr.SKU ?? "").trim() || fallbackSku;
        return {
          sku,
          optionName1: attrs[0]?.name,
          optionValue1: attrs[0]?.values[0],
          optionName2: attrs[1]?.name,
          optionValue2: attrs[1]?.values[0],
          optionName3: attrs[2]?.name,
          optionValue3: attrs[2]?.values[0],
          price,
          compareAtPrice: compareAt,
          weightGrams,
          inventoryQty,
        };
      };

      const slugBase = title;
      if (it.type === "simple") {
        variants.push(buildVariant(r, `${slugBase}-default`));
      } else {
        for (let i = 0; i < it.variations.length; i++) {
          variants.push(buildVariant(it.variations[i], `${slugBase}-v${i + 1}`));
        }
        if (variants.length === 0) {
          variants.push(buildVariant(r, `${slugBase}-default`));
        }
      }

      const normalized: NormalizedProduct = {
        slug: title, // persistProduct will slugify + uniquify
        title,
        description:
          stripHtml(r.Description) || stripHtml(r["Short description"]),
        tags: splitCsvList(r.Tags).join(", ") || null,
        seoTitle:
          (r["Meta: _yoast_wpseo_title"] ?? r["Meta: rank_math_title"] ?? "")
            .trim() || null,
        seoDescription:
          (
            r["Meta: _yoast_wpseo_metadesc"] ??
            r["Meta: rank_math_description"] ??
            ""
          ).trim() || null,
        variants,
        imageUrls: splitCsvList(r.Images),
        collectionTitles: splitCsvList(r.Categories).map(leafCategory),
      };

      process.stdout.write(`[${idx + 1}/${items.length}] ${title}…`);
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
        process.stdout.write(` ✓ ${res.kind} imgs=${res.imageCount}\n`);
        okCount++;
      }
    } catch (e: any) {
      errCount++;
      console.error(
        `[${idx + 1}/${items.length}] ERROR for "${title}":`,
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
