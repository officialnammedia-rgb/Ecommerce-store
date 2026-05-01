import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const RETURNABLE_STATUSES = new Set(["FULFILLED", "PAID"]);
const RETURN_WINDOW_DAYS = 7;

const itemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5).max(1000),
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }
  const returns = await prisma.return.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ ok: true, returns });
}

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
    where: { id: parsed.data.orderId },
    include: { items: true },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (!RETURNABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { ok: false, error: "This order is not eligible for return." },
      { status: 409 },
    );
  }

  // Within return window?
  const ageDays = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > RETURN_WINDOW_DAYS) {
    return NextResponse.json(
      {
        ok: false,
        error: `Return window of ${RETURN_WINDOW_DAYS} days has passed for this order.`,
      },
      { status: 409 },
    );
  }

  // Already a pending return?
  const existing = await prisma.return.findFirst({
    where: {
      orderId: order.id,
      status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "An active return already exists for this order." },
      { status: 409 },
    );
  }

  // Validate item quantities don't exceed ordered quantities.
  const itemMap = new Map(order.items.map((it) => [it.id, it]));
  for (const req of parsed.data.items) {
    const orderItem = itemMap.get(req.orderItemId);
    if (!orderItem) {
      return NextResponse.json(
        { ok: false, error: "Invalid item in return request" },
        { status: 400 },
      );
    }
    if (req.quantity > orderItem.quantity) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot return more than ${orderItem.quantity} of ${orderItem.productTitle}`,
        },
        { status: 400 },
      );
    }
  }

  const created = await prisma.return.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      reason: parsed.data.reason,
      items: {
        create: parsed.data.items.map((it) => ({
          orderItemId: it.orderItemId,
          quantity: it.quantity,
        })),
      },
    },
    include: { items: true },
  });

  await audit({
    actorId: session.user.id,
    action: "return.requested",
    entity: "Return",
    entityId: created.id,
    metadata: { orderNumber: order.orderNumber },
  });

  void sendEmail({
    to: order.email,
    subject: `Return request received for ${order.orderNumber}`,
    html: `<p>We've received your return request for order <b>${order.orderNumber}</b>. Our team will review it and get back to you within 1–2 business days.</p>`,
  });

  return NextResponse.json({ ok: true, return: created });
}
