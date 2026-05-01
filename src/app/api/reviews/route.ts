import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(5).max(2000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Sign in to leave a review" },
      { status: 401 },
    );
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

  // Verified purchase: did this user actually order this product?
  const purchase = await prisma.orderItem.findFirst({
    where: {
      variant: { productId: parsed.data.productId },
      order: { userId: session.user.id, status: { in: ["PAID", "FULFILLED"] } },
    },
    select: { orderId: true },
  });

  // We allow reviews from any signed-in user (consistent with most stores) but
  // we tag verified ones via orderId presence.
  try {
    const review = await prisma.review.upsert({
      where: {
        productId_userId: {
          productId: parsed.data.productId,
          userId: session.user.id,
        },
      },
      update: {
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        body: parsed.data.body,
        orderId: purchase?.orderId ?? undefined,
      },
      create: {
        productId: parsed.data.productId,
        userId: session.user.id,
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        body: parsed.data.body,
        orderId: purchase?.orderId ?? null,
      },
    });
    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Could not save review" },
      { status: 500 },
    );
  }
}
