"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, cartTotals } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { calculateShipping, calculateTax, generateOrderNumber } from "@/lib/orders";
import { getProvider } from "@/lib/payments";
import { getAppliedCouponCode } from "@/app/cart/coupon-actions";
import { validateAndComputeDiscount, consumeDiscount } from "@/lib/discounts";
import { cookies } from "next/headers";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().optional(),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(4).max(12),
  country: z.string().min(2).max(2).default("IN"),
  paymentMethod: z.enum(["COD", "RAZORPAY"]).default("COD"),
  notes: z.string().optional(),
});

export async function placeOrderAction(formData: FormData) {
  const data = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!data.success) {
    throw new Error(data.error.issues.map((i) => i.message).join(", "));
  }

  const cart = await getOrCreateCart();
  if (cart.items.length === 0) throw new Error("Your cart is empty");

  // Validate stock
  for (const item of cart.items) {
    if (item.quantity > item.variant.inventoryQty) {
      throw new Error(
        `${item.variant.product.title} has only ${item.variant.inventoryQty} in stock`,
      );
    }
  }

  const { subtotal } = cartTotals(cart);
  const couponCode = await getAppliedCouponCode();
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
    const address = await tx.address.create({
      data: {
        userId: session?.user?.id ?? null,
        fullName: data.data.fullName,
        phone: data.data.phone,
        line1: data.data.line1,
        line2: data.data.line2 || null,
        city: data.data.city,
        state: data.data.state,
        postalCode: data.data.postalCode,
        country: data.data.country || "IN",
        type: "SHIPPING",
      },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id ?? null,
        email: data.data.email,
        phone: data.data.phone,
        currency: "INR",
        subtotal,
        discountTotal: discountAmount,
        shippingTotal,
        taxTotal,
        grandTotal,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: data.data.paymentMethod,
        shippingAddressId: address.id,
        notes: data.data.notes || null,
        couponCode: appliedCode,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productTitle: item.variant.product.title,
            variantTitle: [item.variant.optionValue1, item.variant.optionValue2]
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

    // Decrement inventory
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { decrement: item.quantity } },
      });
    }

    // Empty the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  // Initialize payment via provider
  const provider = getProvider(data.data.paymentMethod);
  const init = await provider.init({
    orderId: order.id,
    amount: grandTotal,
    currency: "INR",
    customerEmail: data.data.email,
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
    // For COD, mark order as confirmed (PAID treats it as accepted) — payment captured on delivery.
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentStatus: "PENDING" },
    });
  }

  if (appliedCode) {
    await consumeDiscount(appliedCode);
    cookies().delete("ascendyl_coupon");
  }

  revalidatePath("/", "layout");

  if (provider.id === "RAZORPAY") {
    // Send confirmation only after payment is captured (handled in verify route + webhook).
    redirect(`/pay/${order.orderNumber}`);
  }

  // For COD (and any provider that's immediately confirmed), email now.
  void sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: orderConfirmationHtml({
      orderNumber: order.orderNumber,
      email: order.email,
      grandTotal: order.grandTotal,
    }),
  });

  redirect(`/checkout/success?order=${order.orderNumber}`);
}
