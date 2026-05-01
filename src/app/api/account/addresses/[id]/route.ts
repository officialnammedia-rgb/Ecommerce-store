import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const addressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(4).max(12),
  country: z.string().min(2).max(2).default("IN"),
  isDefault: z.boolean().optional().default(false),
});

async function getOwnedAddress(id: string, userId: string) {
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== userId) return null;
  return addr;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }
  const owned = await getOwnedAddress(params.id, session.user.id);
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }
  const { isDefault, ...data } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id, type: "SHIPPING", isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id: params.id },
      data: {
        ...data,
        line2: data.line2 || null,
        isDefault: isDefault ?? owned.isDefault,
      },
    });
  });

  return NextResponse.json({ ok: true, address: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }
  const owned = await getOwnedAddress(params.id, session.user.id);
  if (!owned) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  // Detach from past orders by nulling FK is not needed — orders.shippingAddressId is optional.
  // But schema says `Address.orders` relation; deletion would fail if orders reference it.
  // Safest: soft-delete by setting userId to null so it disappears from book but stays for orders.
  await prisma.address.update({
    where: { id: params.id },
    data: { userId: null, isDefault: false },
  });

  // If we removed the default, promote another.
  if (owned.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: session.user.id, type: "SHIPPING" },
      orderBy: { updatedAt: "desc" },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
