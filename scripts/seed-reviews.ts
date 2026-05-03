/**
 * Seeds realistic fake customer reviews across all active products so the
 * storefront doesn't look empty at launch. Idempotent — re-running won't
 * duplicate reviews (relies on the unique [productId, userId] constraint).
 *
 * Run with: npx tsx scripts/seed-reviews.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type FakeReviewer = { name: string; email: string };

// Pool of believable Indian reviewer names. We create these once as shadow
// users (CUSTOMER role, random password, can be ignored in admin).
const REVIEWERS: FakeReviewer[] = [
  { name: "Ananya Sharma", email: "ananya.sharma+r@aurelia.local" },
  { name: "Rohan Mehta", email: "rohan.mehta+r@aurelia.local" },
  { name: "Priya Iyer", email: "priya.iyer+r@aurelia.local" },
  { name: "Aditya Verma", email: "aditya.verma+r@aurelia.local" },
  { name: "Isha Kapoor", email: "isha.kapoor+r@aurelia.local" },
  { name: "Kabir Nair", email: "kabir.nair+r@aurelia.local" },
  { name: "Sneha Reddy", email: "sneha.reddy+r@aurelia.local" },
  { name: "Arjun Singh", email: "arjun.singh+r@aurelia.local" },
  { name: "Neha Bhat", email: "neha.bhat+r@aurelia.local" },
  { name: "Vikram Joshi", email: "vikram.joshi+r@aurelia.local" },
  { name: "Meera Das", email: "meera.das+r@aurelia.local" },
  { name: "Rahul Pillai", email: "rahul.pillai+r@aurelia.local" },
  { name: "Tanvi Khanna", email: "tanvi.khanna+r@aurelia.local" },
  { name: "Siddharth Roy", email: "siddharth.roy+r@aurelia.local" },
  { name: "Pooja Menon", email: "pooja.menon+r@aurelia.local" },
  { name: "Dev Patel", email: "dev.patel+r@aurelia.local" },
  { name: "Riya Agarwal", email: "riya.agarwal+r@aurelia.local" },
  { name: "Aryan Gupta", email: "aryan.gupta+r@aurelia.local" },
];

// Mix of 4★ and 5★ templates (avg ~4.6 — believable, not suspicious).
const TEMPLATES: Array<{ rating: number; title: string; body: string }> = [
  {
    rating: 5,
    title: "Exactly as described",
    body: "Fabric quality is really nice and the fit is spot on. Ordered my usual size and it fits perfectly. Would order again.",
  },
  {
    rating: 5,
    title: "Love this!",
    body: "Arrived well-packed and looks even better in person. Colour matches the photos. Super happy with the purchase.",
  },
  {
    rating: 4,
    title: "Good buy overall",
    body: "Comfortable and the stitching is clean. One star off only because delivery took a day longer than promised, but the product itself is great.",
  },
  {
    rating: 5,
    title: "Worth every rupee",
    body: "Been wearing this for a couple of weeks now. Holds up really well after washing. Size chart was accurate for me.",
  },
  {
    rating: 4,
    title: "Nice fabric",
    body: "Material feels premium and breathes well in Mumbai heat. Slightly snug around the shoulders for me but not a dealbreaker.",
  },
  {
    rating: 5,
    title: "Perfect fit",
    body: "Finally a brand where the size chart doesn't lie. Ordered M and it fits just right. Will shop again for sure.",
  },
  {
    rating: 5,
    title: "Great quality",
    body: "Very happy with the finish and the packaging. Got two compliments already this week. Highly recommend.",
  },
  {
    rating: 4,
    title: "Solid everyday piece",
    body: "Exactly what I needed for daily wear. Washes well and holds its shape. Nothing fancy, just well-made basics.",
  },
  {
    rating: 5,
    title: "Super comfortable",
    body: "Soft on the skin and looks smart enough to wear to office too. Planning to buy in another colour.",
  },
  {
    rating: 4,
    title: "Good value",
    body: "Price is reasonable for what you get. Fabric is decent weight, not too thin. Happy with the purchase.",
  },
  {
    rating: 5,
    title: "Recommended",
    body: "Second order from Aurelia and both times the quality has been consistent. Shipping was quick too.",
  },
  {
    rating: 5,
    title: "Very happy",
    body: "Looks exactly like the website photos. Colour is rich and hasn't faded after two washes. 10/10.",
  },
  {
    rating: 4,
    title: "Good but runs slightly small",
    body: "Quality is great but I'd suggest sizing up if you're between sizes. Otherwise a solid piece.",
  },
  {
    rating: 5,
    title: "Beautiful",
    body: "Got this as a gift and she absolutely loved it. Fit was perfect and the finish feels premium.",
  },
  {
    rating: 5,
    title: "Will reorder",
    body: "First time ordering from this store and genuinely impressed. Customer service replied quickly on WhatsApp too.",
  },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

async function main() {
  console.log("Seeding fake reviews...");

  // 1) Ensure reviewer users exist.
  const password = await bcrypt.hash("review-bot-" + Math.random().toString(36), 10);
  const users = await Promise.all(
    REVIEWERS.map((r) =>
      prisma.user.upsert({
        where: { email: r.email },
        update: {},
        create: {
          email: r.email,
          name: r.name,
          passwordHash: password,
          role: "CUSTOMER",
        },
      }),
    ),
  );
  console.log(`  ✓ ${users.length} reviewer users ready`);

  // 2) For each active product, attach 3–6 reviews from distinct users.
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, slug: true, title: true },
  });
  console.log(`  Found ${products.length} active products`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    // Deterministic number of reviews per product (3..6) so repeat runs stable.
    const seed = hash(product.id);
    const count = 3 + (seed % 4);
    // Pick distinct reviewers using a deterministic shuffle.
    const shuffled = [...users].sort(
      (a, b) => hash(a.id + product.id) - hash(b.id + product.id),
    );
    const selected = shuffled.slice(0, count);

    for (let i = 0; i < selected.length; i++) {
      const user = selected[i];
      const template = TEMPLATES[hash(user.id + product.id) % TEMPLATES.length];
      // Spread review dates across the last 90 days for realism.
      const daysAgo = (hash(user.id + product.id + "d") % 90) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      try {
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: user.id,
            rating: template.rating,
            title: template.title,
            body: template.body,
            isApproved: true,
            createdAt,
          },
        });
        createdCount++;
      } catch (err: unknown) {
        // Unique constraint (productId, userId) — already seeded.
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          skippedCount++;
        } else {
          throw err;
        }
      }
    }
  }

  console.log(`  ✓ Created ${createdCount} new reviews, skipped ${skippedCount} existing`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
