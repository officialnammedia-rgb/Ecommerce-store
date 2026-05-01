import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/reset-token";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "New password must be 8+ characters" },
      { status: 400 },
    );
  }
  const verified = verifyResetToken(parsed.data.token);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({ where: { id: verified.uid } });
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: "Reset link is invalid" }, { status: 400 });
  }
  if (user.passwordHash.slice(0, 12) !== verified.pfp) {
    return NextResponse.json(
      { ok: false, error: "This reset link has already been used. Request a new one." },
      { status: 400 },
    );
  }
  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });
  return NextResponse.json({ ok: true });
}
