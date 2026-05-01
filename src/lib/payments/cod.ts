import type { PaymentProvider } from "./types";

export const codProvider: PaymentProvider = {
  id: "COD",
  label: "Cash on Delivery",
  async init() {
    return { provider: "COD", paid: false };
  },
};
