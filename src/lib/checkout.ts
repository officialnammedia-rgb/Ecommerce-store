import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartTotals } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { calculateShipping, calculateTax, generateOrderNumber } from "@/lib/orders";
import { getProvider } from "@/lib/payments";
import { validateAndComputeDiscount, consumeDiscount } from "@/lib/discounts";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";

export const placeOrderSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(4).max(12),
  country: z.string().min(2).max(2).default("IN"),
  paymentMethod: z.enum(["COD", "RAZORPAY"]).default("COD"),
  notes: z.string().optional().or(z.literal("")),
  // Optional: user picked an existing address from their book.
  savedAddressId: z.string().optional().or(z.literal("")),
  // Optional: logged-in user wants this (newly typed) address saved to their book.
  saveAddress: z.boolean().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; redirect: string; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const cart = await getOrCreateCart();
  if (cart.items.length === 0) return { ok: false, error: "Your cart is empty" };

  // Validate stock
  for (const item of cart.items) {
    if (item.quantity > item.variant.inventoryQty) {
      return {
        ok: false,
        error: `${item.variant.product.title} has only ${item.variant.inventoryQty} in stock`,
      };
    }
  }

  const { subtotal } = cartTotals(cart);
  const couponCode = cookies().get("aurelia_coupon")?.value ?? null;
  let discountAmount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const r = await validateAndComputeDiscount(couponCode, subtotal);
    if (r.ok) {
      discountAmount = r.discount.amount;
      appliedCode = r.discount.code;
    }
  }
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingTotal = calculateShipping(subtotalAfterDiscount);
  const taxTotal = calculateTax(subtotalAfterDiscount);
  const grandTotal = subtotalAfterDiscount + shippingTotal + taxTotal;

  const session = await getSession();

  const order = await prisma.$transaction(async (tx) => {
    let addressId: string;

    // If the user picked a saved address, reuse it — DON'T clone, which would
    // duplicate the row in their address book every time they ordered.
    if (input.savedAddressId && session?.user?.id) {
      const existing = await tx.address.findFirst({
        where: { id: input.savedAddressId, userId: session.user.id },
        select: { id: true },
      });
      if (!existing) throw new Error("Saved address not found");
      addressId = existing.id;
    } else {
      // New address typed into checkout. Only add to the book when the logged-in
      // user explicitly opted in; otherwise keep it as an order-only snapshot.
      const shouldSaveToBook = !!(session?.user?.id && input.saveAddress);
      const created = await tx.address.create({
        data: {
          userId: session?.user?.id ?? null,
          fullName: input.fullName,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2 || null,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country || "IN",
          type: "SHIPPING",
          savedInBook: shouldSaveToBook,
        },
      });
      addressId = created.id;

      // First address in book becomes the default.
      if (shouldSaveToBook) {
        const hasDefault = await tx.address.count({
          where: {
            userId: session.user.id,
            type: "SHIPPING",
            savedInBook: true,
            isDefault: true,
            id: { not: created.id },
          },
        });
        if (hasDefault === 0) {
          await tx.address.update({
            where: { id: created.id },
            data: { isDefault: true },
          });
        }
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id ?? null,
        email: input.email,
        phone: input.phone,
        currency: "INR",
        subtotal,
        discountTotal: discountAmount,
        shippingTotal,
        taxTotal,
        grandTotal,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: input.paymentMethod,
        shippingAddressId: addressId,
        notes: input.notes || null,
        couponCode: appliedCode,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productTitle: item.variant.product.title,
            variantTitle:
              [item.variant.optionValue1, item.variant.optionValue2]
                .filter(Boolean)
                .join(" / ") || null,
            sku: item.variant.sku,
            unitPrice: item.priceSnapshot,
            quantity: item.quantity,
            imageUrl: item.variant.product.images[0]?.url ?? null,
          })),
        },
      },
    });

    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  // Initialize payment via provider
  const provider = getProvider(input.paymentMethod);
  const init = await provider.init({
    orderId: order.id,
    amount: grandTotal,
    currency: "INR",
    customerEmail: input.email,
  });

  const providerOrderId =
    (init.clientPayload?.razorpayOrderId as string | undefined) ?? null;

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: provider.id,
      providerOrderId,
      amount: grandTotal,
      currency: "INR",
      status: init.paid ? "SUCCEEDED" : "PENDING",
      rawPayload: init.clientPayload ? JSON.stringify(init.clientPayload) : null,
    },
  });

  if (provider.id === "COD") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentStatus: "PENDING" },
    });
  }

  if (appliedCode) {
    await consumeDiscount(appliedCode);
    cookies().delete("aurelia_coupon");
  }

  if (provider.id === "RAZORPAY") {
    return { ok: true, orderNumber: order.orderNumber, redirect: `/pay/${order.orderNumber}` };
  }

  void sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: orderConfirmationHtml({
      orderNumber: order.orderNumber,
      email: order.email,
      grandTotal: order.grandTotal,
    }),
  });

  return {
    ok: true,
    orderNumber: order.orderNumber,
    redirect: `/checkout/success?order=${order.orderNumber}`,
  };
}
