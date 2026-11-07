/**
 * Marketplace commission (PROPOSED business model: 2%, subject to legal/commercial review).
 * No payment integration exists, so NOTHING here collects money. These are pure calculations for
 * future use. Commission applies ONLY to completed transactions confirmed by BOTH parties:
 * enquiries, chats, offers, agreed-but-unconfirmed and disputed deals never count.
 */
export const COMMISSION_BPS = 200; // basis points: 200 = 2.00%

export const TRANSACTION_STATUSES = ['enquiry', 'offer_accepted', 'completed', 'cancelled', 'disputed', 'refunded'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface TransactionFacts {
  status: TransactionStatus;
  salePriceInr: number;          // whole rupees, agreed price
  buyerConfirmedAt: string | null;
  sellerConfirmedAt: string | null;
}
export interface CommissionResult { eligible: boolean; commissionPaise: number; reason: string }

export function calculateCommission(tx: TransactionFacts, bps: number = COMMISSION_BPS): CommissionResult {
  if (!Number.isInteger(tx.salePriceInr) || tx.salePriceInr < 0) return { eligible: false, commissionPaise: 0, reason: 'invalid sale price' };
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) return { eligible: false, commissionPaise: 0, reason: 'invalid commission rate' };
  if (tx.status !== 'completed') return { eligible: false, commissionPaise: 0, reason: `status "${tx.status}" is not a completed transaction` };
  if (!tx.buyerConfirmedAt || !tx.sellerConfirmedAt) return { eligible: false, commissionPaise: 0, reason: 'completion not confirmed by both parties' };
  // paise = rupees * 100 * bps / 10000 = rupees * bps / 100 ; round half up, integer maths only
  const commissionPaise = Math.floor((tx.salePriceInr * bps + 50) / 100);
  return { eligible: true, commissionPaise, reason: 'completed and confirmed by both parties' };
}

/** Provider fees and taxes are NOT platform revenue; they are reported separately. */
export function settlementBreakdown(commissionPaise: number, providerFeePaise: number, taxPaise: number) {
  for (const v of [commissionPaise, providerFeePaise, taxPaise]) if (!Number.isInteger(v) || v < 0) throw new Error('Amounts must be non-negative integer paise');
  return { platformRevenuePaise: commissionPaise, providerFeePaise, taxPaise, totalDeductionsPaise: commissionPaise + providerFeePaise + taxPaise };
}
