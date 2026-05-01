import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const STATUS = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;

const schema = z.object({
  status: z.enum(STATUS),
  adminNote: z.string().max(1000).optional().nullable(),
  refundAmount: z.number().int().min(0).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
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
  const existing = await prisma.return.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.return.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? existing.adminNote,
      refundAmount: parsed.data.refundAmount ?? existing.refundAmount,
    },
  });

  await audit({
    actorId: session.user.id,
    action: `return.${parsed.data.status.toLowerCase()}`,
    entity: "Return",
    entityId: existing.id,
  });

  // Notify customer on key transitions
  const order = await prisma.order.findUnique({ where: { id: existing.orderId } });
  if (order && ["APPROVED", "REJECTED", "REFUNDED"].includes(parsed.data.status)) {
    const subjects: Record<string, string> = {
      APPROVED: `Return approved for ${order.orderNumber}`,
      REJECTED: `Return request update for ${order.orderNumber}`,
      REFUNDED: `Refund issued for ${order.orderNumber}`,
    };
    void sendEmail({
      to: order.email,
      subject: subjects[parsed.data.status] ?? `Return update for ${order.orderNumber}`,
      html: `<p>Your return for order <b>${order.orderNumber}</b> is now <b>${parsed.data.status}</b>.${parsed.data.adminNote ? `<br/><br/><i>${parsed.data.adminNote}</i>` : ""}</p>`,
    });
  }

  return NextResponse.json({ ok: true, return: updated });
}
