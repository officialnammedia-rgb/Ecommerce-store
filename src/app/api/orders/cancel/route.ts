import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const schema = z.object({ orderNumber: z.string().min(1) });

const CANCELLABLE = new Set(["PENDING_PAYMENT", "PAID"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { items: true, payments: true },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (!CANCELLABLE.has(order.status)) {
    return NextResponse.json(
      { ok: false, error: `This order can no longer be cancelled (${order.status}).` },
      { status: 409 },
    );
  }

  // Restock variants
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventoryQty: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  });

  await audit({
    actorId: session.user.id,
    action: "order.cancel.customer",
    entity: "Order",
    entityId: order.id,
    metadata: { orderNumber: order.orderNumber },
  });

  void sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} cancelled`,
    html: `<p>Your order <b>${order.orderNumber}</b> has been cancelled. If you paid online, the refund will be initiated within 24 hours.</p>`,
  });

  return NextResponse.json({ ok: true });
}
