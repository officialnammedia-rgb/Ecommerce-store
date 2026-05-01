import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

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
  // Replace cart contents with this single item for an express-checkout flow.
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      variantId,
      quantity,
      priceSnapshot: variant.price,
    },
  });

  return NextResponse.json({ ok: true, redirect: "/checkout" });
}
