import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartTotals } from "@/lib/cart";

const schema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive().max(20).default(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }
  if (variant.inventoryQty < quantity) {
    return NextResponse.json({ error: "Out of stock" }, { status: 409 });
  }

  const cart = await getOrCreateCart();
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

  const fresh = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true },
  });
  const itemCount = fresh ? fresh.items.reduce((acc, i) => acc + i.quantity, 0) : 0;

  return NextResponse.json({ ok: true, itemCount });
}
