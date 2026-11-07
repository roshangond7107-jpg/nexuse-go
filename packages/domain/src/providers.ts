/** Extension points. No provider is active while CHECKOUT_ENABLED=false. */
export interface PaymentProvider {
  readonly id: string;
  createPaymentIntent(input: { orderId: string; amountInr: number; buyerId: string }): Promise<{ providerRef: string; clientSecret?: string }>;
  verifyWebhook(rawBody: string, signature: string): Promise<{ valid: boolean; eventId?: string }>;
  refund(input: { providerRef: string; amountInr: number }): Promise<{ refundRef: string }>;
}
export interface ShippingProvider {
  readonly id: string;
  quote(input: { fromPin: string; toPin: string; weightGrams: number }): Promise<{ amountInr: number; etaDays: number }>;
  createShipment(input: { orderId: string }): Promise<{ trackingId: string }>;
}
export type FulfilmentMethod = 'local_pickup' | 'seller_arranged_delivery';

export function isCheckoutEnabled(env: Record<string, string | undefined>): boolean {
  return env.CHECKOUT_ENABLED === 'true';
}
