import type { PaymentProvider } from "./types";
import { codProvider } from "./cod";
import { razorpayProvider } from "./razorpay";

export const providers: Record<string, PaymentProvider> = {
  COD: codProvider,
  RAZORPAY: razorpayProvider,
};

export function getProvider(id: string): PaymentProvider {
  const p = providers[id];
  if (!p) throw new Error(`Unknown payment provider: ${id}`);
  return p;
}

export function listEnabledProviders(): PaymentProvider[] {
  const list: PaymentProvider[] = [codProvider];
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    list.push(razorpayProvider);
  }
  return list;
}
