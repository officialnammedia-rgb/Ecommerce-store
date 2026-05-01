import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { placeOrder, placeOrderSchema } from "@/lib/checkout";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }
  const result = await placeOrder(parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
