// Payment provider interface — Razorpay implementation slots in here in P13.
// For now, COD acts as the default working method to enable end-to-end checkout.

export type PaymentInitInput = {
  orderId: string;
  amount: number; // paise
  currency: "INR";
  customerEmail: string;
};

export type PaymentInitResult = {
  provider: "COD" | "RAZORPAY" | "STUB";
  // For client-side providers, you'll return tokens / order ids here.
  clientPayload?: Record<string, unknown>;
  // Indicates whether the order is immediately considered paid (e.g., COD = false until delivery).
  paid: boolean;
};

export interface PaymentProvider {
  id: "COD" | "RAZORPAY" | "STUB";
  label: string;
  init(input: PaymentInitInput): Promise<PaymentInitResult>;
  verifyWebhook?(rawBody: string, headers: Record<string, string>): Promise<{ ok: boolean; orderId?: string; status?: string }>;
  refund?(orderId: string, amount: number): Promise<{ ok: boolean; refundId?: string }>;
}
