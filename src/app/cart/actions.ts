"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

export async function addToCartAction(variantId: string, quantity = 1) {
  if (quantity <= 0) return;
  const cart = await getOrCreateCart();
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");
  if (variant.inventoryQty < quantity) throw new Error("Insufficient stock");

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, variant.inventoryQty);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, priceSnapshot: variant.price },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
        priceSnapshot: variant.price,
      },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout"); // refresh header count
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  if (quantity < 0) throw new Error("Invalid quantity");
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { variant: true, cart: true },
  });
  if (!item) return;
  // Ensure caller has access via same cart
  const cart = await getOrCreateCart();
  if (cart.id !== item.cartId) throw new Error("Forbidden");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const capped = Math.min(quantity, item.variant.inventoryQty);
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: capped },
    });
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(itemId: string) {
  return updateCartItemAction(itemId, 0);
}

export async function clearCartAction() {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
