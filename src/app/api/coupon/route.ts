import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getOrCreateCart, cartTotals } from "@/lib/cart";
import { validateAndComputeDiscount } from "@/lib/discounts";

const COOKIE = "ascendyl_coupon";
const schema = z.object({ code: z.string().min(1).max(60) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    cookies().delete(COOKIE);
    return NextResponse.json({ ok: false, error: "Enter a code" });
  }
  const cart = await getOrCreateCart();
  const { subtotal } = cartTotals(cart);
  const result = await validateAndComputeDiscount(parsed.data.code, subtotal);
  if (!result.ok) {
    cookies().delete(COOKIE);
    return NextResponse.json({ ok: false, error: result.error });
  }
  cookies().set(COOKIE, result.discount.code, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  return NextResponse.json({ ok: true, code: result.discount.code });
}

export async function DELETE() {
  cookies().delete(COOKIE);
  return NextResponse.json({ ok: true });
}
