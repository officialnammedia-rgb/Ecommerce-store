import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "forgot-password"), {
    capacity: 5,
    refillPerSecond: 5 / 600,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: true }); // Don't leak rate-limit info
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // Always return ok to prevent enumeration
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.trim().toLowerCase();
  const all = await prisma.user.findMany({
    select: { id: true, email: true, passwordHash: true, name: true },
  });
  const user = all.find((u) => u.email.toLowerCase() === email);

  if (user?.passwordHash) {
    const token = createResetToken(user.id, user.passwordHash);
    const baseUrl = process.env.STORE_BASE_URL ?? "http://localhost:3000";
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    void sendEmail({
      to: user.email,
      subject: `Reset your password`,
      html: `
        <p>Hi ${user.name ?? ""},</p>
        <p>Click the link below to reset your password. The link is valid for 30 minutes.</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
  }

  // Always return ok to prevent email enumeration.
  return NextResponse.json({ ok: true });
}
