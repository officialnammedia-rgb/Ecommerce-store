// Shipping rules for India. Free above threshold, flat fee below.

const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999
const FLAT_RATE_PAISE = 9900; // ₹99

export function calculateShipping(subtotalPaise: number): number {
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE) return 0;
  return FLAT_RATE_PAISE;
}

export function calculateTax(_subtotalPaise: number): number {
  // GST handled later. Return 0 for v1.
  return 0;
}

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASC-${ts}-${rand}`;
}
