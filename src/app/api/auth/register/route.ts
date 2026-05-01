import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "register"), {
    capacity: 5,
    refillPerSecond: 5 / 600, // 5 per 10 minutes
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, password } = parsed.data;
  // Normalize email to avoid duplicate-by-case accounts (e.g. user@x.com vs USER@x.com).
  const email = parsed.data.email.trim().toLowerCase();

  // Case-insensitive duplicate check (works on SQLite + Postgres).
  const all = await prisma.user.findMany({ select: { id: true, email: true } });
  const exists = all.some((u) => u.email.toLowerCase() === email);
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "CUSTOMER",
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user });
}
