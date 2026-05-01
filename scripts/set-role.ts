/**
 * Promote/demote a user by email.
 *
 * Usage:
 *   npx tsx scripts/set-role.ts <email> <ADMIN|MANAGER|CUSTOMER>
 *
 * Email match is case-insensitive (works with SQLite).
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const [, , emailArg, roleArg] = process.argv;
  if (!emailArg || !roleArg) {
    console.error("Usage: tsx scripts/set-role.ts <email> <ADMIN|MANAGER|CUSTOMER>");
    process.exit(1);
  }
  const role = roleArg.toUpperCase();
  if (!["ADMIN", "MANAGER", "CUSTOMER"].includes(role)) {
    console.error(`Invalid role "${roleArg}". Use ADMIN, MANAGER, or CUSTOMER.`);
    process.exit(1);
  }

  const all = await prisma.user.findMany({ select: { id: true, email: true } });
  const matches = all.filter((u) => u.email.toLowerCase() === emailArg.toLowerCase());

  if (matches.length === 0) {
    console.error(`No user found with email "${emailArg}".`);
    process.exit(1);
  }

  for (const u of matches) {
    await prisma.user.update({
      where: { id: u.id },
      // role is an enum on the schema; cast keeps tsx happy without generated enum import
      data: { role: role as "ADMIN" | "MANAGER" | "CUSTOMER" },
    });
    console.log(`✓ ${u.email} → ${role}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
