"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const schema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.string().optional(),
});

export async function createCollectionAction(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("Invalid input");
  const slug = parsed.data.slug?.trim() ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  const exists = await prisma.collection.findUnique({ where: { slug } });
  if (exists) throw new Error("Slug already in use");
  await prisma.collection.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      isFeatured: parsed.data.isFeatured === "on",
    },
  });
  revalidatePath("/admin/collections");
}

export async function deleteCollectionAction(id: string) {
  await requireAdmin();
  await prisma.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
}
