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

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id, type: "SHIPPING" },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ ok: true, addresses });
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
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const { isDefault, ...data } = parsed.data;

  // Auto-default the very first address.
  const existingCount = await prisma.address.count({
    where: { userId: session.user.id, type: "SHIPPING" },
  });
  const shouldBeDefault = isDefault || existingCount === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id, type: "SHIPPING", isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        ...data,
        line2: data.line2 || null,
        userId: session.user.id,
        type: "SHIPPING",
        isDefault: shouldBeDefault,
      },
    });
  });

  return NextResponse.json({ ok: true, address: created });
}
