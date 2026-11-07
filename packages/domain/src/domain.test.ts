import { describe, it, expect } from 'vitest';
import { calculateAge, isMinor, restrictionFor, capabilities } from './age';
import { canTransition, assertTransition, requiresModerator } from './status';
import { formatINR, checkPricing, discountPercent, checkOffer } from './pricing';
import { scanListingText } from './prohibited';
import { isCheckoutEnabled } from './providers';

const now = new Date('2025-06-15T00:00:00Z');

describe('age', () => {
  it('computes age across birthday boundary', () => {
    expect(calculateAge(new Date('2007-06-15T00:00:00Z'), now)).toBe(18);
    expect(calculateAge(new Date('2007-06-16T00:00:00Z'), now)).toBe(17);
  });
  it('flags minors and rejects future DOB', () => {
    expect(isMinor(new Date('2010-01-01T00:00:00Z'), now)).toBe(true);
    expect(isMinor(new Date('2000-01-01T00:00:00Z'), now)).toBe(false);
    expect(() => isMinor(new Date('2030-01-01T00:00:00Z'), now)).toThrow();
  });
  it('restricts minors until guardian verified', () => {
    const dob = new Date('2010-01-01T00:00:00Z');
    expect(capabilities(restrictionFor(dob, false, now)).canChat).toBe(false);
    expect(capabilities(restrictionFor(dob, true, now)).canChat).toBe(true);
    expect(capabilities(restrictionFor(dob, true, now)).canSeeTargetedContent).toBe(false);
    expect(capabilities(restrictionFor(new Date('2000-01-01T00:00:00Z'), false, now)).canSeeTargetedContent).toBe(true);
  });
});

describe('listing status machine', () => {
  it('allows legal and blocks illegal transitions', () => {
    expect(canTransition('draft', 'pending_review')).toBe(true);
    expect(canTransition('draft', 'active')).toBe(false);
    expect(canTransition('sold', 'active')).toBe(false);
    expect(() => assertTransition('draft', 'sold')).toThrow();
  });
  it('requires moderator for approval/rejection', () => {
    expect(requiresModerator('pending_review', 'active')).toBe(true);
    expect(requiresModerator('active', 'reserved')).toBe(false);
  });
});

describe('pricing', () => {
  it('formats INR with Indian grouping', () => {
    expect(formatINR(125000).replace(/\s/g, '')).toBe('₹1,25,000');
  });
  it('rejects bad prices', () => {
    expect(checkPricing(-1).ok).toBe(false);
    expect(checkPricing(10.5).ok).toBe(false);
    expect(checkPricing(500, 400).ok).toBe(false);
    expect(checkPricing(400, 500).ok).toBe(true);
  });
  it('only shows discount when original price is genuinely higher', () => {
    expect(discountPercent(400, 500)).toBe(20);
    expect(discountPercent(500, 500)).toBeNull();
    expect(discountPercent(500, null)).toBeNull();
  });
  it('validates offers', () => {
    expect(checkOffer(300, 400).ok).toBe(true);
    expect(checkOffer(0, 400).ok).toBe(false);
    expect(checkOffer(401, 400).ok).toBe(false);
  });
});

describe('prohibited scan', () => {
  it('flags risky text for review', () => {
    expect(scanListingText('Replica watch, no bill').categories).toContain('stolen_or_counterfeit');
    expect(scanListingText('call 9876543210').categories).toContain('off_platform_contact');
    expect(scanListingText('NCERT Physics Class 12, good condition').flagged).toBe(false);
  });
});

describe('checkout flag', () => {
  it('is off unless explicitly true', () => {
    expect(isCheckoutEnabled({})).toBe(false);
    expect(isCheckoutEnabled({ CHECKOUT_ENABLED: 'false' })).toBe(false);
    expect(isCheckoutEnabled({ CHECKOUT_ENABLED: 'true' })).toBe(true);
  });
});

import { calculateCommission, settlementBreakdown, COMMISSION_BPS } from './commission';
import { can } from './roles';
const done = { status: 'completed', salePriceInr: 1000, buyerConfirmedAt: '2025-01-01', sellerConfirmedAt: '2025-01-01' } as const;
describe('commission (proposed 2%)', () => {
  it('is 2% in paise on a completed, both-confirmed sale', () => {
    expect(COMMISSION_BPS).toBe(200);
    expect(calculateCommission(done)).toEqual({ eligible: true, commissionPaise: 2000, reason: 'completed and confirmed by both parties' });
    expect(calculateCommission({ ...done, salePriceInr: 150 }).commissionPaise).toBe(300);
  });
  it('never charges on enquiries, offers, unconfirmed, disputed, cancelled or refunded', () => {
    for (const status of ['enquiry', 'offer_accepted', 'cancelled', 'disputed', 'refunded'] as const) expect(calculateCommission({ ...done, status }).eligible).toBe(false);
    expect(calculateCommission({ ...done, sellerConfirmedAt: null }).commissionPaise).toBe(0);
    expect(calculateCommission({ ...done, buyerConfirmedAt: null }).eligible).toBe(false);
  });
  it('rejects invalid inputs', () => {
    expect(calculateCommission({ ...done, salePriceInr: -5 }).eligible).toBe(false);
    expect(calculateCommission(done, 20000).eligible).toBe(false);
  });
  it('keeps provider fees and tax out of platform revenue', () => {
    const b = settlementBreakdown(2000, 300, 54);
    expect(b.platformRevenuePaise).toBe(2000); expect(b.totalDeductionsPaise).toBe(2354);
    expect(() => settlementBreakdown(-1, 0, 0)).toThrow();
  });
});
describe('role mirror', () => {
  it('limits moderators and users', () => {
    expect(can('user', 'moderate_listing')).toBe(false);
    expect(can('moderator', 'handle_report')).toBe(true);
    expect(can('moderator', 'manage_communities')).toBe(false);
    expect(can('admin', 'grant_roles')).toBe(true);
  });
});
