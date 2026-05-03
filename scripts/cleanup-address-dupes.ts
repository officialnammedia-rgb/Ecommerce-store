/**
 * One-time cleanup for the existing Neon DB:
 * Any address that is referenced by an Order AND has at least one "twin"
 * (same user + same line1/postalCode/phone) gets marked savedInBook=false
 * so it no longer appears in /account/addresses. The un-referenced twin stays
 * in the book — that's the user's original saved address.
 *
 * Idempotent; safe to run multiple times.
 *
 * Run with: npx tsx scripts/cleanup-address-dupes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up duplicate addresses in book...");

  // Only look at user-owned addresses that are currently in the book.
  const addrs = await prisma.address.findMany({
    where: { userId: { not: null }, savedInBook: true },
    include: { orders: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Group by a simple dedup key.
  const groups = new Map<string, typeof addrs>();
  for (const a of addrs) {
    const key = [
      a.userId,
      a.line1.trim().toLowerCase(),
      a.postalCode.trim(),
      a.phone.trim(),
    ].join("|");
    const arr = groups.get(key) ?? [];
    arr.push(a);
    groups.set(key, arr);
  }

  let hidden = 0;
  for (const [, arr] of groups) {
    if (arr.length < 2) continue;

    // Keep the earliest address that has no order references (the "saved in book"
    // original). If all have orders, keep the earliest and hide the rest.
    const withoutOrders = arr.filter((a) => a.orders.length === 0);
    const keeper = (withoutOrders[0] ?? arr[0]).id;

    for (const a of arr) {
      if (a.id === keeper) continue;
      await prisma.address.update({
        where: { id: a.id },
        data: { savedInBook: false },
      });
      hidden++;
    }
  }

  console.log(`  ✓ Hid ${hidden} duplicate addresses from book`);
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
