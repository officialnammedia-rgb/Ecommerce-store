// Email transport. Uses Resend if RESEND_API_KEY is set, otherwise logs to console.

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Store <noreply@example.com>";
  if (!apiKey) {
    // Dev fallback
    // eslint-disable-next-line no-console
    console.log(`[email:dev] -> ${to} | ${subject}\n${text ?? html}`);
    return { ok: true, dev: true } as const;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    // eslint-disable-next-line no-console
    console.error("[email] Resend error:", res.status, body);
    return { ok: false } as const;
  }
  return { ok: true } as const;
}

export function orderConfirmationHtml(order: {
  orderNumber: string;
  email: string;
  grandTotal: number;
}) {
  const total = (order.grandTotal / 100).toFixed(0);
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; padding: 16px;">
<h2>Thanks for your order!</h2>
<p>Order <b>${order.orderNumber}</b> received. Total: <b>₹${total}</b>.</p>
<p>We'll send another email when it ships.</p>
</body></html>`;
}

export function shipmentEmailHtml(input: {
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
}) {
  return `<!doctype html>
<html><body style="font-family: system-ui, sans-serif; padding: 16px;">
<h2>Your order is on its way</h2>
<p>Order <b>${input.orderNumber}</b> shipped via <b>${input.carrier}</b>.</p>
<p>Tracking: <b>${input.trackingNumber}</b>${input.trackingUrl ? ` — <a href="${input.trackingUrl}">Track</a>` : ""}</p>
</body></html>`;
}
