import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

const schema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(50),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { itemId, quantity } = parsed.data;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { variant: true, cart: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cart = await getOrCreateCart();
  if (cart.id !== item.cartId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const capped = Math.min(quantity, item.variant.inventoryQty);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: capped } });
  }
  return NextResponse.json({ ok: true });
}
