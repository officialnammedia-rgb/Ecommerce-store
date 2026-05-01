import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyClientSignature } from "@/lib/payments/razorpay";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";

const schema = z.object({
  orderNumber: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ok = verifyClientSignature({
    razorpay_order_id: parsed.data.razorpay_order_id,
    razorpay_payment_id: parsed.data.razorpay_payment_id,
    razorpay_signature: parsed.data.razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { payments: { where: { providerOrderId: parsed.data.razorpay_order_id }, take: 1 } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentStatus: "PAID" },
    }),
    prisma.payment.updateMany({
      where: {
        orderId: order.id,
        providerOrderId: parsed.data.razorpay_order_id,
      },
      data: {
        status: "SUCCEEDED",
        providerPaymentId: parsed.data.razorpay_payment_id,
      },
    }),
  ]);

  void sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: orderConfirmationHtml({
      orderNumber: order.orderNumber,
      email: order.email,
      grandTotal: order.grandTotal,
    }),
  });

  return NextResponse.json({ ok: true });
}
