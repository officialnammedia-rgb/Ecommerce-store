"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { sendEmail, shipmentEmailHtml } from "@/lib/email";
import { audit } from "@/lib/audit";

const STATUS_VALUES = [
  "PENDING_PAYMENT",
  "PAID",
  "FULFILLED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
});

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsed = updateStatusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid status");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found");

  const next = parsed.data.status;

  // Restock on cancellation if not already cancelled/refunded
  if (
    (next === "CANCELLED" || next === "REFUNDED") &&
    order.status !== "CANCELLED" &&
    order.status !== "REFUNDED"
  ) {
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { increment: item.quantity } },
      });
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: next,
      paymentStatus:
        next === "REFUNDED" ? "REFUNDED" : next === "CANCELLED" ? order.paymentStatus : order.paymentStatus,
    },
  });

  await audit({
    actorId: session.user.id,
    action: "order.status",
    entity: "Order",
    entityId: orderId,
    metadata: { from: order.status, to: next },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
}

const fulfillSchema = z.object({
  carrier: z.string().min(1).max(80),
  trackingNumber: z.string().min(1).max(120),
  trackingUrl: z.string().url().optional().or(z.literal("")),
});

export async function fulfillOrderAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const parsed = fulfillSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.fulfillment.create({
    data: {
      orderId,
      carrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl || null,
      status: "SHIPPED",
      shippedAt: new Date(),
    },
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "FULFILLED" },
  });

  void sendEmail({
    to: updated.email,
    subject: `Your order ${updated.orderNumber} has shipped`,
    html: shipmentEmailHtml({
      orderNumber: updated.orderNumber,
      carrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl || null,
    }),
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(orderId: string) {
  const session = await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true, items: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "REFUNDED") return;

  const successful = order.payments.find((p) => p.status === "SUCCEEDED");

  if (successful?.provider === "RAZORPAY" && successful.providerPaymentId) {
    const { refundRazorpayPayment } = await import("@/lib/payments/razorpay");
    await refundRazorpayPayment(successful.providerPaymentId, order.grandTotal);
  }

  // Restock items
  if (order.status !== "CANCELLED" && order.status !== "REFUNDED") {
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { increment: item.quantity } },
      });
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    }),
    successful
      ? prisma.payment.update({
          where: { id: successful.id },
          data: { status: "REFUNDED" },
        })
      : prisma.payment.findFirst({ where: { id: "__noop__" } }),
  ]);

  await audit({
    actorId: session.user.id,
    action: "order.refund",
    entity: "Order",
    entityId: orderId,
    metadata: {
      provider: successful?.provider ?? "NONE",
      amount: order.grandTotal,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function addOrderNoteAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const note = String(formData.get("notes") ?? "").trim();
  await prisma.order.update({
    where: { id: orderId },
    data: { notes: note || null },
  });
  revalidatePath(`/admin/orders/${orderId}`);
}
