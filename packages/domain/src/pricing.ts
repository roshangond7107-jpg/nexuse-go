/** Prices are integer paise-free rupees stored as integers (whole ₹) to avoid float errors. */
export function formatINR(rupees: number): string {
  if (!Number.isInteger(rupees) || rupees < 0) throw new Error('Price must be a non-negative integer');
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
}

export interface PricingCheck { ok: boolean; error?: string }
export function checkPricing(price: number, originalPrice?: number | null): PricingCheck {
  if (!Number.isInteger(price) || price < 0) return { ok: false, error: 'Price must be a non-negative whole number' };
  if (price > 10_000_000) return { ok: false, error: 'Price exceeds allowed maximum' };
  if (originalPrice != null) {
    if (!Number.isInteger(originalPrice) || originalPrice < 0) return { ok: false, error: 'Original price invalid' };
    if (originalPrice < price) return { ok: false, error: 'Original price cannot be below selling price' };
  }
  return { ok: true };
}

/** Returns a discount only when a seller-declared original price exceeds price; never fabricated. */
export function discountPercent(price: number, originalPrice?: number | null): number | null {
  if (originalPrice == null || originalPrice <= price || originalPrice === 0) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/** Offer must be positive and not exceed asking price. */
export function checkOffer(offer: number, askingPrice: number): PricingCheck {
  if (!Number.isInteger(offer) || offer <= 0) return { ok: false, error: 'Offer must be a positive whole number' };
  if (offer > askingPrice) return { ok: false, error: 'Offer cannot exceed asking price' };
  return { ok: true };
}
