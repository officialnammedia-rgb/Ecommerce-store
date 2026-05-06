import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const GUEST_COOKIE = "ascendyl_guest_cart";

/**
 * Read-only cart fetch — safe to call from server components.
 * Returns null when no cart exists yet (e.g. brand new visitor).
 */
export async function readCart() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const guestToken = cookies().get(GUEST_COOKIE)?.value ?? null;

  if (userId) {
    return prisma.cart.findFirst({ where: { userId }, include: cartInclude });
  }
  if (guestToken) {
    return prisma.cart.findUnique({ where: { guestToken }, include: cartInclude });
  }
  return null;
}

export function emptyCartTotals() {
  return { subtotal: 0, itemCount: 0 };
}

/**
 * Create-or-merge cart. **Must only be called inside Server Actions or Route Handlers**
 * because it may write cookies (guest token, deletion on merge).
 */
export async function getOrCreateCart() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const cookieStore = cookies();
  let guestToken = cookieStore.get(GUEST_COOKIE)?.value ?? null;

  // Logged in: prefer user cart and merge guest cart if present
  if (userId) {
    let userCart = await prisma.cart.findFirst({
      where: { userId },
      include: cartInclude,
    });
    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId },
        include: cartInclude,
      });
    }
    if (guestToken) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestToken },
        include: { items: true },
      });
      if (guestCart && guestCart.id !== userCart.id) {
        for (const item of guestCart.items) {
          const existing = userCart.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            await prisma.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + item.quantity },
            });
          } else {
            await prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                variantId: item.variantId,
                quantity: item.quantity,
                priceSnapshot: item.priceSnapshot,
              },
            });
          }
        }
        await prisma.cart.delete({ where: { id: guestCart.id } });
      }
      cookieStore.delete(GUEST_COOKIE);
      userCart = await prisma.cart.findUniqueOrThrow({
        where: { id: userCart.id },
        include: cartInclude,
      });
    }
    return userCart;
  }

  // Guest: ensure guest cart exists
  if (guestToken) {
    const cart = await prisma.cart.findUnique({
      where: { guestToken },
      include: cartInclude,
    });
    if (cart) return cart;
  }
  guestToken = randomUUID();
  cookieStore.set(GUEST_COOKIE, guestToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return prisma.cart.create({
    data: { guestToken },
    include: cartInclude,
  });
}

export const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: { take: 1, orderBy: { position: "asc" as const } } } },
        },
      },
    },
  },
} as const;

export type CartWithItems = Awaited<ReturnType<typeof getOrCreateCart>>;

export function cartTotals(cart: CartWithItems) {
  const subtotal = cart.items.reduce(
    (acc, i) => acc + i.priceSnapshot * i.quantity,
    0,
  );
  const itemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);
  return { subtotal, itemCount };
}
