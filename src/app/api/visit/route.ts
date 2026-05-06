import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Lightweight visit logger. Called once per page navigation from the client.
// Uses an anonymous session cookie so repeat views within a session are grouped.
export async function POST(req: Request) {
  let path = "/";
  try {
    const body = (await req.json()) as { path?: string };
    if (body && typeof body.path === "string" && body.path.length < 500) {
      path = body.path;
    }
  } catch {
    // ignore — still log the visit with default path
  }

  // Skip admin/API pings so they don't pollute analytics.
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const jar = cookies();
  let sessionId = jar.get("ascendyl_sid")?.value;
  const hdrs = headers();

  const response = NextResponse.json({ ok: true });

  if (!sessionId) {
    sessionId = cryptoRandom();
    // 30-day anonymous session for visitor analytics.
    response.cookies.set("ascendyl_sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  try {
    await prisma.pageView.create({
      data: {
        path,
        sessionId,
        userAgent: hdrs.get("user-agent")?.slice(0, 500) ?? null,
        referer: hdrs.get("referer")?.slice(0, 500) ?? null,
      },
    });
  } catch {
    // Never break the page just because analytics failed.
  }

  return response;
}

function cryptoRandom(): string {
  // URL-safe 16 bytes.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
