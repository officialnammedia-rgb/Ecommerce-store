import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  let valid = false;
  try {
    valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event?.payload?.payment?.entity;
  const internalOrderId = payment?.notes?.internal_order;
  const providerPaymentId = payment?.id;
  const providerOrderId = payment?.order_id;

  if (!internalOrderId || !providerOrderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    await prisma.$transaction([
      prisma.order.updateMany({
        where: { id: internalOrderId, paymentStatus: { not: "PAID" } },
        data: { status: "PAID", paymentStatus: "PAID" },
      }),
      prisma.payment.updateMany({
        where: { orderId: internalOrderId, providerOrderId },
        data: {
          status: "SUCCEEDED",
          providerPaymentId: providerPaymentId ?? undefined,
          rawPayload: rawBody,
        },
      }),
    ]);
  } else if (event.event === "payment.failed") {
    await prisma.payment.updateMany({
      where: { orderId: internalOrderId, providerOrderId },
      data: {
        status: "FAILED",
        rawPayload: rawBody,
      },
    });
  } else if (event.event === "refund.processed") {
    await prisma.order.update({
      where: { id: internalOrderId },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    });
  }

  return NextResponse.json({ ok: true });
}
