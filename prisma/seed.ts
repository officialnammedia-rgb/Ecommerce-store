/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@ascendyl.test";
  const adminPassword = "admin123"; // change after first login

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Store Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const collections = await Promise.all(
    [
      { slug: "all", title: "All", isFeatured: false, position: 0 },
      { slug: "new", title: "New Arrivals", isFeatured: true, position: 1 },
      { slug: "women", title: "Women", isFeatured: true, position: 2 },
      { slug: "men", title: "Men", isFeatured: true, position: 3 },
      { slug: "sale", title: "Sale", isFeatured: false, position: 4 },
    ].map((c) =>
      prisma.collection.upsert({
        where: { slug: c.slug },
        update: { title: c.title, isFeatured: c.isFeatured, position: c.position },
        create: c,
      }),
    ),
  );

  const colByslug = Object.fromEntries(collections.map((c) => [c.slug, c]));

  const sampleProducts = [
    {
      slug: "essential-cotton-tee",
      title: "Essential Cotton Tee",
      description: "Soft, breathable cotton tee. A wardrobe essential.",
      tags: "tee,cotton,unisex",
      collections: ["all", "new", "men", "women"],
      basePrice: 99900, // ₹999
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Black", "White", "Sand"],
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900",
      ],
    },
    {
      slug: "relaxed-linen-shirt",
      title: "Relaxed Linen Shirt",
      description: "Lightweight linen with a relaxed fit. Perfect for warm days.",
      tags: "shirt,linen",
      collections: ["all", "new", "men"],
      basePrice: 199900,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Off White", "Sage"],
      images: [
        "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=900",
      ],
    },
    {
      slug: "classic-denim-jeans",
      title: "Classic Denim Jeans",
      description: "Mid-rise straight fit jeans in premium denim.",
      tags: "jeans,denim",
      collections: ["all", "men", "women"],
      basePrice: 249900,
      sizes: ["28", "30", "32", "34", "36"],
      colors: ["Indigo", "Black"],
      images: [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=900",
      ],
    },
    {
      slug: "summer-floral-dress",
      title: "Summer Floral Dress",
      description: "Flowy midi dress with subtle floral print.",
      tags: "dress,women",
      collections: ["all", "new", "women", "sale"],
      basePrice: 299900,
      compareAt: 399900,
      sizes: ["XS", "S", "M", "L"],
      colors: ["Blush", "Sky"],
      images: [
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900",
      ],
    },
  ];

  for (const p of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        tags: p.tags,
        status: "ACTIVE",
        options: {
          create: [
            { name: "Size", position: 0, values: { create: p.sizes.map((v) => ({ value: v })) } },
            { name: "Color", position: 1, values: { create: p.colors.map((v) => ({ value: v })) } },
          ],
        },
        images: {
          create: p.images.map((url, i) => ({ url, alt: p.title, position: i })),
        },
      },
    });

    // create variants for each size x color combination
    for (const size of p.sizes) {
      for (const color of p.colors) {
        const sku = `${p.slug.toUpperCase().replace(/-/g, "_")}-${size}-${color.toUpperCase().replace(/\s+/g, "_")}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            optionName1: "Size",
            optionValue1: size,
            optionName2: "Color",
            optionValue2: color,
            price: p.basePrice,
            compareAtPrice: (p as any).compareAt ?? null,
            inventoryQty: 25,
            lowStockAt: 5,
          },
        });
      }
    }

    for (const slug of p.collections) {
      const col = colByslug[slug];
      if (!col) continue;
      await prisma.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId: col.id, productId: product.id } },
        update: {},
        create: { collectionId: col.id, productId: product.id },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: "store.name" },
    update: { value: process.env.STORE_NAME ?? "Ascendyl" },
    create: { key: "store.name", value: process.env.STORE_NAME ?? "Ascendyl" },
  });

  await prisma.page.upsert({
    where: { slug: "shipping-returns" },
    update: {},
    create: {
      slug: "shipping-returns",
      title: "Shipping & Returns",
      body: "We ship across India. Easy 7-day returns on unworn items.",
    },
  });
  await prisma.page.upsert({
    where: { slug: "faq" },
    update: {},
    create: { slug: "faq", title: "FAQ", body: "Common questions answered here." },
  });

  console.log("\nSeed complete.");
  console.log("Admin login:");
  console.log(`  email:    ${adminEmail}`);
  console.log(`  password: ${adminPassword}`);
  console.log(`  user id:  ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
