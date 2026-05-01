# Deployment runbook — Aurelia store

This walks you from "code on my laptop" to "live store on the internet" in about
**60–90 minutes**, assuming you don't get stuck on KYC.

Stack: **Vercel** (app) + **Neon** (Postgres) + **Resend** (email) + **Razorpay** (payments) + **Cloudinary** (images, optional).

---

## 0. One-time accounts to create (≈30 min, only the bits you don't have)

1. **GitHub** — push this repo to a private repo if not already.
2. **Vercel** — sign up with GitHub.
3. **Neon** — sign up with GitHub. Create a project in **AWS Mumbai (ap-south-1)** for low latency.
4. **Resend** — sign up. You'll add DNS records to verify your domain (~5 min).
5. **Razorpay** — sign up + submit live KYC (PAN, GST if you have one, bank account, business proof). Approval takes 1–3 business days.
6. **Domain** — buy from Namecheap or Cloudflare Registrar (~₹1,000/yr).

---

## 1. Switch the database to Postgres (5 min)

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Delete the `prisma/migrations/` folder (SQLite migrations don't translate cleanly).
You'll create a fresh migration against Postgres in step 3.

---

## 2. Provision Neon database (5 min)

1. In Neon dashboard → **New project** → name it `aurelia-prod`.
2. Region: **AWS ap-south-1 (Mumbai)**.
3. Copy the **pooled connection string** (looks like `postgresql://user:pass@xxx.neon.tech/dbname?sslmode=require`).

Optional: also copy the **direct (non-pooled) URL** for migrations.

---

## 3. Migrate schema + seed (5 min)

Locally, with the Neon URL exported:

```bash
export DATABASE_URL="postgresql://...neon.tech/dbname?sslmode=require"
npx prisma migrate dev --name init
npx prisma db seed   # if you have a seed script
```

You should see all 26 tables created in Neon's SQL editor.

---

## 4. Push to GitHub (2 min)

```bash
git add -A
git commit -m "Production-ready"
git push origin main
```

Make sure `.env`, `prisma/dev.db*` are in `.gitignore` (they already are).

---

## 5. Deploy to Vercel (10 min)

1. Vercel dashboard → **Add New → Project** → import the GitHub repo.
2. Framework: Next.js (auto-detected).
3. Don't deploy yet — go to **Environment Variables** first.

### Required environment variables

| Name | Value | Where to get |
|------|-------|--------------|
| `DATABASE_URL` | postgresql://...neon.tech/... | Neon dashboard (pooled URL) |
| `NEXTAUTH_SECRET` | A long random string | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | https://your-domain.com | Your custom domain |
| `STORE_BASE_URL` | https://your-domain.com | Same as above |
| `STORE_NAME` | Aurelia | Or your brand name |
| `RAZORPAY_KEY_ID` | rzp_live_xxx | Razorpay dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | xxx | Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | xxx | Razorpay → Webhooks → Add new |
| `RESEND_API_KEY` | re_xxx | Resend dashboard |
| `EMAIL_FROM` | Aurelia <hi@your-domain.com> | Use a verified domain in Resend |

### Optional but recommended

| Name | Value |
|------|-------|
| `STORE_SUPPORT_EMAIL` | support@your-domain.com |
| `CLOUDINARY_CLOUD_NAME` | If using Cloudinary for product images |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |

Click **Deploy**. First build takes ~3 min.

---

## 6. Connect your domain (10 min)

1. Vercel → Project → **Settings → Domains** → Add `your-domain.com` and `www.your-domain.com`.
2. Vercel shows DNS records you need. At your domain registrar (Namecheap/Cloudflare):
   - For root: **A record** → `76.76.21.21`
   - For www: **CNAME** → `cname.vercel-dns.com`
3. Wait 2–10 minutes for DNS propagation. SSL auto-provisions.

---

## 7. Wire up Razorpay webhook (5 min)

1. Razorpay dashboard → **Webhooks → Add New**.
2. URL: `https://your-domain.com/api/payments/razorpay/webhook`
3. Events: tick `payment.captured`, `payment.failed`, `order.paid`.
4. Copy the **webhook secret** → set as `RAZORPAY_WEBHOOK_SECRET` in Vercel.
5. Redeploy (Vercel → Deployments → ⋯ → Redeploy) so the new env var takes effect.

---

## 8. Verify Resend domain (5 min)

1. Resend dashboard → **Domains → Add Domain** → `your-domain.com`.
2. Add the 3 DNS records (DKIM + return-path + SPF) at your registrar.
3. Wait for "Verified" status.
4. Test from Resend dashboard → send a test email to yourself.

---

## 9. Create your admin user (3 min)

The first user signs up normally at `/register`. Then in Neon SQL editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

You'll now see the **/admin** sidebar.

---

## 10. Smoke test the live site (10 min)

- [ ] Visit homepage — loads
- [ ] Browse a product — variant picker works
- [ ] Add to cart → checkout → place a **₹1 test order** with Razorpay
- [ ] Confirmation email arrives
- [ ] Cancel order from `/account/orders/[id]` → cancellation email arrives
- [ ] Edit profile, change password
- [ ] Add a saved address; pick it at next checkout
- [ ] Submit a return request; approve from `/admin/returns`; status email arrives
- [ ] Try `/some-bad-url` → custom 404
- [ ] Force an error → custom error page

**If all 10 pass, you are live.**

---

## Day-2 things to do within first week

1. Replace placeholder Unsplash images with real product photography.
2. Update legal pages: `/pages/privacy`, `/pages/terms`, `/pages/shipping`, `/pages/returns` with your actual policies + contact info.
3. Set up **UptimeRobot** (free) — pings your site every 5 min, doubles as a Neon "wake up" call so cold-starts don't hit real users.
4. Set up **Sentry** (free tier) for error tracking.
5. Submit sitemap to Google Search Console: `https://your-domain.com/sitemap.xml`.
6. Set up Plausible/GA4 for analytics.

---

## When to upgrade from free tiers

- **Resend Pro ($20/mo)** when you hit ~50 orders/day (100 emails/day limit on free).
- **Vercel Pro ($20/mo)** when you hit consistent traffic spikes during sales.
- **Neon Launch ($19/mo)** when DB grows past 500 MB OR you want always-on (no cold starts).

Total at scale: **~₹5,000/mo** for a store doing 100+ orders/day.

---

## Rollback plan

Vercel keeps every deployment. If a deploy breaks production:

1. Vercel → Deployments → previous good deploy → **Promote to Production**.
2. Takes ~10 seconds. Zero downtime.

Database changes are harder to roll back. Always test migrations on Neon's branch feature before applying to main branch.
