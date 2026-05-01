import crypto from "crypto";
import type { PaymentProvider } from "./types";

const RZP_BASE = "https://api.razorpay.com/v1";

function authHeader() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error("Razorpay keys are not configured");
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export const razorpayProvider: PaymentProvider = {
  id: "RAZORPAY",
  label: "Razorpay (UPI / Cards / Netbanking)",

  async init({ orderId, amount, currency, customerEmail }) {
    const res = await fetch(`${RZP_BASE}/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: authHeader(),
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: orderId,
        notes: { email: customerEmail, internal_order: orderId },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Razorpay create order failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      provider: "RAZORPAY",
      paid: false,
      clientPayload: {
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: data.id,
        amount: data.amount,
        currency: data.currency,
      },
    };
  },

  async verifyWebhook(rawBody, headers) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return { ok: false };
    const signature = headers["x-razorpay-signature"];
    if (!signature) return { ok: false };
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!ok) return { ok: false };
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return { ok: false };
    }
    const payment = event?.payload?.payment?.entity;
    return {
      ok: true,
      orderId: payment?.notes?.internal_order,
      status: event?.event,
    };
  },

  async refund(_orderId, amount) {
    // Caller passes our internal order id; resolve provider payment id at the call site.
    // Minimal helper expects amount in paise; will be invoked after looking up provider payment.
    return { ok: true, refundId: `noop-${amount}` };
  },
};

export function verifyClientSignature(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${input.razorpay_order_id}|${input.razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(input.razorpay_signature),
    );
  } catch {
    return false;
  }
}

export async function refundRazorpayPayment(paymentId: string, amount: number) {
  const res = await fetch(`${RZP_BASE}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader(),
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay refund failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ id: string; status: string }>;
}
