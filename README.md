# Ascendyl — Clothing E‑commerce (India)

A production-style clothing storefront with admin panel, built for the Indian market.

**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · NextAuth · Razorpay · Resend · SQLite (dev) / Postgres (prod).

**Money**: All amounts stored as integer **paise** (smallest INR unit) to avoid float errors.

## Quick start

```bash
cp .env.example .env
npm install
npm run prisma:migrate -- --name init   # only on first setup
npm run db:seed                          # creates admin + sample products
npm run dev                              # http://localhost:3000
```

After seeding:

- **Storefront**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Default admin**: `admin@ascendyl.test` / `admin123` (change after first login)

## Features

### Storefront
- Home with featured collections + new arrivals
- Collection pages, product detail with size/color variant picker, in-stock awareness
- Search across title/description/tags
- Cart with guest support (cookie token), merges into account on login
- Coupon application
- Checkout: address → payment method → order review
- COD or Razorpay payment
- Customer account: order history + per-order detail

### Admin (`/admin`, RBAC: `ADMIN` or `MANAGER`)
- Dashboard with revenue, order counts, low-stock alerts
- Products: create/edit, generated variants from size × color matrix, per-variant price/inventory, image upload
- Collections: featured-on-home, manual product assignment
- Orders: status workflow (`PENDING_PAYMENT` → `PAID` → `FULFILLED` → `DELIVERED` / `CANCELLED` / `REFUNDED`), notes, fulfillment + tracking, **refund**
- Customers list
- Discounts: PERCENT or FIXED, min subtotal, usage limits, activate/deactivate

### Payments
- Provider abstraction in `src/lib/payments/`
- COD works out of the box
- **Razorpay** enabled when `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are set:
  - Server creates Razorpay order during checkout
  - Client opens Razorpay checkout from `/pay/[orderNumber]`
  - `/api/payments/razorpay/verify` validates HMAC, marks order PAID, emails customer
  - `/api/payments/razorpay/webhook` validates `x-razorpay-signature` for authoritative status updates (`payment.captured`, `payment.failed`, `refund.processed`)
  - Refund button on admin order detail calls Razorpay refund API

### Other
- SEO: per-product JSON-LD, dynamic `sitemap.xml`, `robots.txt`
- Email: Resend if `RESEND_API_KEY`, else logs to console (dev fallback)
- Audit log on key admin mutations
- Rate limit on the register endpoint (in-memory; swap with Redis in production)

## Run flow to verify everything

1. `npm run dev`, open `/`
2. Browse a product, pick size/color, add to cart, open `/cart`
3. Apply a discount (create one in `/admin/discounts` first)
4. `/checkout` → place a COD order → see `/checkout/success`
5. `/admin/orders` → open the order → mark fulfilled with tracking → status email logged
6. `/account` → view order history

## Razorpay setup (when ready)

1. Create test keys at https://dashboard.razorpay.com/
2. Set in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
3. Restart `npm run dev`. Razorpay appears on the checkout page automatically.
4. Add webhook in Razorpay dashboard pointing to `https://YOUR_DOMAIN/api/payments/razorpay/webhook` with events:
   `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`.

For local webhook testing use `ngrok http 3000`.

## Production checklist

- Switch Prisma `provider` from `sqlite` to `postgresql` in `prisma/schema.prisma`, point `DATABASE_URL` to managed Postgres (Neon/Supabase/RDS), run `prisma migrate deploy`.
- Set `NEXTAUTH_SECRET` to a long random string.
- Set `STORE_BASE_URL` to your real origin.
- Replace local `/public/uploads` with S3/R2 (swap `src/app/api/admin/upload/route.ts`).
- Replace in-memory rate limiter with Upstash/Redis-backed.
- Bump Next.js to a patched 14.2.x release before launch.
- Configure DKIM/SPF for transactional email domain.
- Add Sentry / monitoring.
- Backups for the database.

## Project structure

```
prisma/                Prisma schema + seed
src/
  app/
    (storefront pages: /, /collections, /products, /search, /cart, /checkout, /account, /pay)
    admin/             Admin UI (RBAC-gated)
    api/               Auth, upload, Razorpay verify/webhook
  components/          UI primitives, storefront, admin
  lib/                 prisma, auth, session, cart, orders, payments/, discounts, email, audit, rate-limit
  middleware.ts        Auth + role gate for /admin, /account, /api/admin
public/uploads/        Local image storage (dev)
```

