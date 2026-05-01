"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  tags: z.string().optional(),
  imageUrls: z.string().optional(), // newline-separated
  sizes: z.string().optional(), // comma-separated
  colors: z.string().optional(), // comma-separated
  basePriceRupees: z.coerce.number().int().nonnegative(),
  inventoryPerVariant: z.coerce.number().int().nonnegative().default(0),
  collectionIds: z.array(z.string()).optional(),
});

export async function createProductAction(formData: FormData) {
  const session = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const collectionIds = formData.getAll("collectionIds").map(String).filter(Boolean);
  const parsed = createSchema.safeParse({ ...raw, collectionIds });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.title);

  const sizes = (data.sizes ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const colors = (data.colors ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const imageUrls = (data.imageUrls ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) throw new Error("Slug already exists");

  const product = await prisma.product.create({
    data: {
      slug,
      title: data.title,
      description: data.description || null,
      status: data.status,
      tags: data.tags || null,
      images: { create: imageUrls.map((url, i) => ({ url, position: i, alt: data.title })) },
      options: {
        create: [
          ...(sizes.length
            ? [{ name: "Size", position: 0, values: { create: sizes.map((v) => ({ value: v })) } }]
            : []),
          ...(colors.length
            ? [{ name: "Color", position: 1, values: { create: colors.map((v) => ({ value: v })) } }]
            : []),
        ],
      },
    },
  });

  // Build variant matrix
  const priceP = data.basePriceRupees * 100;
  const sizeList = sizes.length ? sizes : [null];
  const colorList = colors.length ? colors : [null];
  for (const size of sizeList) {
    for (const color of colorList) {
      const skuParts = [slug.toUpperCase().replace(/-/g, "_")];
      if (size) skuParts.push(size);
      if (color) skuParts.push(color.toUpperCase().replace(/\s+/g, "_"));
      const sku = skuParts.join("-");
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          optionName1: size ? "Size" : null,
          optionValue1: size ?? null,
          optionName2: color ? "Color" : null,
          optionValue2: color ?? null,
          price: priceP,
          inventoryQty: data.inventoryPerVariant ?? 0,
        },
      });
    }
  }

  if (collectionIds.length) {
    await prisma.collectionProduct.createMany({
      data: collectionIds.map((cid) => ({ collectionId: cid, productId: product.id })),
    });
  }

  await audit({
    actorId: session.user.id,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    metadata: { slug: product.slug, title: product.title },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  tags: z.string().optional(),
  imageUrls: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
});

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const collectionIds = formData.getAll("collectionIds").map(String).filter(Boolean);
  const parsed = updateSchema.safeParse({ ...raw, collectionIds });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  const data = parsed.data;
  const slug = slugify(data.slug);

  const imageUrls = (data.imageUrls ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        status: data.status,
        tags: data.tags || null,
      },
    }),
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.createMany({
      data: imageUrls.map((url, i) => ({ productId, url, position: i, alt: data.title })),
    }),
    prisma.collectionProduct.deleteMany({ where: { productId } }),
    ...(collectionIds.length
      ? [
          prisma.collectionProduct.createMany({
            data: collectionIds.map((cid) => ({ collectionId: cid, productId })),
          }),
        ]
      : []),
  ]);

  await audit({
    actorId: session.user.id,
    action: "product.update",
    entity: "Product",
    entityId: productId,
    metadata: { slug, title: data.title },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${slug}`);
}

export async function deleteProductAction(productId: string) {
  const session = await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  await audit({
    actorId: session.user.id,
    action: "product.delete",
    entity: "Product",
    entityId: productId,
  });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateVariantAction(variantId: string, formData: FormData) {
  await requireAdmin();
  const priceRupees = Number(formData.get("priceRupees"));
  const inventoryQty = Number(formData.get("inventoryQty"));
  const compareAtRupees = formData.get("compareAtRupees");

  if (Number.isNaN(priceRupees) || priceRupees < 0) throw new Error("Invalid price");
  if (Number.isNaN(inventoryQty) || inventoryQty < 0) throw new Error("Invalid inventory");

  const v = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      price: Math.round(priceRupees * 100),
      inventoryQty,
      compareAtPrice:
        compareAtRupees && String(compareAtRupees).trim() !== ""
          ? Math.round(Number(compareAtRupees) * 100)
          : null,
    },
  });
  revalidatePath(`/admin/products/${v.productId}`);
}

export async function deleteVariantAction(variantId: string) {
  await requireAdmin();
  const v = await prisma.productVariant.delete({ where: { id: variantId } });
  revalidatePath(`/admin/products/${v.productId}`);
}
