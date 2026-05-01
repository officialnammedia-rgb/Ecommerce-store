"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const schema = z.object({
  code: z.string().min(1).max(60),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().nonnegative(),
  minSubtotal: z.coerce.number().int().nonnegative().default(0),
  usageLimit: z.string().optional(),
  isActive: z.string().optional(),
});

export async function createDiscountAction(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("Invalid input");
  const code = parsed.data.code.toUpperCase().trim();
  const exists = await prisma.discount.findUnique({ where: { code } });
  if (exists) throw new Error("Code already exists");

  // For PERCENT, value is 1-100. For FIXED, value is in rupees -> store paise.
  const value = parsed.data.type === "PERCENT"
    ? Math.min(100, Math.max(1, parsed.data.value))
    : parsed.data.value * 100;
  const minSubtotal = parsed.data.minSubtotal * 100;
  const usageLimit = parsed.data.usageLimit ? Number(parsed.data.usageLimit) : null;

  await prisma.discount.create({
    data: {
      code,
      type: parsed.data.type,
      value,
      minSubtotal,
      usageLimit: usageLimit && !Number.isNaN(usageLimit) ? usageLimit : null,
      isActive: parsed.data.isActive === "on" || parsed.data.isActive === undefined,
    },
  });

  revalidatePath("/admin/discounts");
}

export async function deleteDiscountAction(id: string) {
  await requireAdmin();
  await prisma.discount.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountAction(id: string) {
  await requireAdmin();
  const d = await prisma.discount.findUnique({ where: { id } });
  if (!d) return;
  await prisma.discount.update({
    where: { id },
    data: { isActive: !d.isActive },
  });
  revalidatePath("/admin/discounts");
}
