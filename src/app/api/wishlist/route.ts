import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const COOKIE = "ascendyl_favs";

function read(): string[] {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  cookies().set(COOKIE, JSON.stringify(list), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

const schema = z.object({ productId: z.string().min(1) });

export async function GET() {
  return NextResponse.json({ items: read() });
}

export async function POST(req: Request) {
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
  const list = read();
  const id = parsed.data.productId;
  let favorited: boolean;
  if (list.includes(id)) {
    write(list.filter((x) => x !== id));
    favorited = false;
  } else {
    write([...list, id]);
    favorited = true;
  }
  return NextResponse.json({ favorited, count: read().length });
}
