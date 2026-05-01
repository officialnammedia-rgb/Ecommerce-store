import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

const schema = z.object({ itemId: z.string().min(1) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await prisma.cartItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item) return NextResponse.json({ ok: true });

  const cart = await getOrCreateCart();
  if (cart.id !== item.cartId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.cartItem.delete({ where: { id: parsed.data.itemId } });
  return NextResponse.json({ ok: true });
}
