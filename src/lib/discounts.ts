import { prisma } from "@/lib/prisma";

export type AppliedDiscount = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  amount: number; // discount amount in paise applied to subtotal
};

export async function validateAndComputeDiscount(
  code: string,
  subtotalPaise: number,
): Promise<{ ok: true; discount: AppliedDiscount } | { ok: false; error: string }> {
  const upper = code.trim().toUpperCase();
  if (!upper) return { ok: false, error: "Enter a code" };

  const d = await prisma.discount.findUnique({ where: { code: upper } });
  if (!d) return { ok: false, error: "Invalid code" };
  if (!d.isActive) return { ok: false, error: "Code is inactive" };
  const now = new Date();
  if (d.startsAt && d.startsAt > now) return { ok: false, error: "Code not yet valid" };
  if (d.endsAt && d.endsAt < now) return { ok: false, error: "Code expired" };
  if (d.usageLimit && d.usedCount >= d.usageLimit) {
    return { ok: false, error: "Code usage limit reached" };
  }
  if (subtotalPaise < d.minSubtotal) {
    return {
      ok: false,
      error: `Minimum subtotal of ₹${(d.minSubtotal / 100).toFixed(0)} required`,
    };
  }

  let amount = 0;
  if (d.type === "PERCENT") {
    amount = Math.floor((subtotalPaise * d.value) / 100);
  } else if (d.type === "FIXED") {
    amount = Math.min(d.value, subtotalPaise);
  } else {
    return { ok: false, error: "Unsupported discount type" };
  }

  return {
    ok: true,
    discount: {
      code: d.code,
      type: d.type as "PERCENT" | "FIXED",
      value: d.value,
      amount,
    },
  };
}

export async function consumeDiscount(code: string) {
  await prisma.discount.update({
    where: { code: code.toUpperCase() },
    data: { usedCount: { increment: 1 } },
  });
}
