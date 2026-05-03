import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns the current live-visitor count (distinct sessions in the last 5 min).
// Admin-only because it's only consumed by the dashboard widget.
export async function GET() {
  const session = await getSession();
  if (!isAdminRole(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { sessionId: true },
    distinct: ["sessionId"],
  });
  return NextResponse.json({ live: rows.length, at: new Date().toISOString() });
}
