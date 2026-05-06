# Import products from femfabs.com → Ascendyl

Two ways to do this. **Method A (API) is easier** — no login required. Use
Method B (CSV) only if Method A fails for some reason.

---

## Method A — Public Store API (no login) ✅ recommended

Every modern WooCommerce site exposes a read-only public API at
`/wp-json/wc/store/v1/products`. femfabs.com has it confirmed working — its
catalog (~306 products) is fully readable without credentials.

### 1. Make sure your local `.env` has DB + Cloudinary

Run from your **local machine**, not Vercel. Your `.env` must point at the
production Neon DB and Cloudinary account so the data lands in the right place:

```
DATABASE_URL="postgresql://...neon..."
CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@dy3zbarlq"
```

(Copy from Vercel → Project → Settings → Environment Variables, or run
`vercel env pull .env.local` and merge.)

### 2. Dry run — verify the API works

```
npm run import:woo-api -- --site=https://femfabs.com --dry-run --skip-images --limit=5
```

You should see something like:

```
→ Fetched page 1/62 (5 products)
→ 5 parents (0 simple, 5 variable)
  • variable id=26813  sku="BK-BLU-773a99a3"  "Women's Seamless Ribbed Crop Tank Top..."  variations=3
  ...
```

### 3. Trial run — first 5 products as drafts

```
npm run import:woo-api -- --site=https://femfabs.com --limit=5
```

Defaults are safe: imported as **DRAFT**. Open `/admin/products`, find the
imported items, click each, sanity-check title / price / images / variants.
If anything looks wrong, delete from `/admin/products` and re-run.

### 4. Full import

```
npm run import:woo-api -- --site=https://femfabs.com
```

This will take a while — the script fetches each variation individually to
get its SKU/price/stock. Roughly 1 request per variant + Cloudinary upload
per image. Plan for **20–40 minutes** for ~300 products.

When happy, multi-select on `/admin/products` and switch to **ACTIVE**.
Or import directly active:

```
npm run import:woo-api -- --site=https://femfabs.com --status=ACTIVE
```

### Resuming an interrupted run

The importer is idempotent on slug — already-imported products are skipped.
Just re-run the same command and it picks up where it left off. Use
`--update` to overwrite existing products if you want to re-import.

---

## Method B — CSV export (requires WordPress login)

Use only if Method A fails or you specifically want to filter the catalog
in the WP admin before importing.

### 1. Export the catalog from WP Admin

1. Log in to `https://femfabs.com/wp-admin/`
2. **Products → All products → Export**
3. Leave **columns** as default ("Export all columns")
4. **Product types**: tick `simple` and `variable`
5. **Categories**: leave blank for everything
6. Tick **"Export custom meta?"**
7. Click **Generate CSV**, save as `imports/femfabs.csv`

### 2. Run the importer

```
npm run import:woo -- --file=./imports/femfabs.csv --dry-run
npm run import:woo -- --file=./imports/femfabs.csv --limit=5
npm run import:woo -- --file=./imports/femfabs.csv
```

---

## Flags reference (both importers)

| Flag                       | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `--site=<url>` (API only)  | Source WooCommerce site root, e.g. `https://femfabs.com` |
| `--file=<path>` (CSV only) | Path to the WooCommerce CSV export                       |
| `--dry-run`                | Parse + summarise; no DB writes, no image uploads        |
| `--status=DRAFT\|ACTIVE`   | Status for newly created products. Default: `DRAFT`      |
| `--limit=N`                | Only import the first `N` parent products               |
| `--update`                 | Overwrite existing products (matched by slug)            |
| `--skip-images`            | Don't migrate images. Faster trial runs                  |
| `--images-per-product=N`   | Cap images per product (default 8)                       |
| `--per-page=N` (API only)  | Page size for the Store API (default 50, max 100)       |
| `--start-page=N` (API only)| Resume listing from a specific page                      |

---

## What gets imported

| WooCommerce                 | Ascendyl                                              |
| --------------------------- | ----------------------------------------------------- |
| Name                        | `Product.title` (+ slug derived from title)           |
| Description                 | `Product.description` (HTML stripped)                 |
| Regular / sale price        | `ProductVariant.price` + `compareAtPrice` (paise)     |
| In-stock flag               | `ProductVariant.inventoryQty` (100 if in stock)       |
| SKU                         | `ProductVariant.sku` (auto-generated if missing)      |
| Attributes + variations     | `ProductOption` + `ProductOptionValue` + variants     |
| Categories                  | `Collection` (one per category)                       |
| Tags                        | `Product.tags` (comma-separated)                      |
| Images                      | Downloaded → re-uploaded to Cloudinary → `ProductImage` |

## What's NOT imported

- Customer reviews — run `npm run reviews:seed` for sample reviews if needed
- Coupons — set up afresh in `/admin/discounts`
- Customer accounts / past orders
- WooCommerce-specific fields: external/affiliate URLs, downloadable files,
  cross-sells / up-sells

---

## Troubleshooting

- **Cloudinary error**: make sure `CLOUDINARY_URL` in `.env` is the full
  URL from your Cloudinary dashboard (not truncated).
- **DB error**: confirm `DATABASE_URL` points to the right environment.
  Run `npx prisma db push --skip-generate` if the schema is out of date.
- **API returns 401/403**: the site has the Store API locked behind
  Cloudflare or similar — fall back to Method B (CSV).
- **Image fetch fails**: usually transient. Re-run with `--update` to
  retry images for the same products.
