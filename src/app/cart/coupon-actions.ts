"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOrCreateCart, cartTotals } from "@/lib/cart";
import { validateAndComputeDiscount } from "@/lib/discounts";

const COOKIE = "aurelia_coupon";

export async function applyCouponAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    cookies().delete(COOKIE);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: false, error: "Enter a code" };
  }
  const cart = await getOrCreateCart();
  const { subtotal } = cartTotals(cart);
  const result = await validateAndComputeDiscount(code, subtotal);
  if (!result.ok) {
    cookies().delete(COOKIE);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: false, error: result.error };
  }
  cookies().set(COOKIE, result.discount.code, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function removeCouponAction() {
  cookies().delete(COOKIE);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function getAppliedCouponCode(): Promise<string | null> {
  return cookies().get(COOKIE)?.value ?? null;
}
