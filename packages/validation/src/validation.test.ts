import { describe, it, expect } from 'vitest';
import { normalizeIndianPhone, sendOtpSchema, profileSchema, listingSchema, offerSchema, validateImageMeta, sniffImageType, sanitizePlainText, reportSchema } from './index';

const uuid = '123e4567-e89b-12d3-a456-426614174000';

describe('phone', () => {
  it.each([['9876543210'], ['+919876543210'], ['919876543210'], ['09876543210'], ['98765 43210']])('normalises %s', (i) => {
    expect(normalizeIndianPhone(i)).toBe('+919876543210');
  });
  it.each([['1234567890'], ['98765'], ['+14155550123'], ['abcdefghij'], ['']])('rejects %s', (i) => {
    expect(normalizeIndianPhone(i)).toBeNull();
  });
  it('requires captcha token for OTP send', () => {
    expect(sendOtpSchema.safeParse({ phone: '9876543210', captchaToken: '' }).success).toBe(false);
    expect(sendOtpSchema.safeParse({ phone: '9876543210', captchaToken: 't' }).success).toBe(true);
  });
});

describe('profile', () => {
  const base = { displayName: 'Asha', city: 'Kota', state: 'Rajasthan', acceptedTerms: true as const };
  it('derives minor flag', () => {
    const r = profileSchema.parse({ ...base, dateOfBirth: '2012-01-01' });
    expect(r.isMinor).toBe(true);
    expect(profileSchema.parse({ ...base, dateOfBirth: '1999-01-01' }).isMinor).toBe(false);
  });
  it('rejects future DOB and missing terms', () => {
    expect(profileSchema.safeParse({ ...base, dateOfBirth: '2999-01-01' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, acceptedTerms: false, dateOfBirth: '2000-01-01' }).success).toBe(false);
  });
});

describe('listing', () => {
  const ok = { title: 'NCERT Physics Class 12', description: 'Good condition, no markings inside.', categoryId: uuid, price: 200, condition: 'good', city: 'Kota', state: 'Rajasthan', imagePaths: ['a.jpg'] };
  it('accepts valid listing and defaults quantity', () => {
    const r = listingSchema.parse(ok);
    expect(r.quantity).toBe(1);
  });
  it('rejects no photos, bad condition, inverted original price, bad PIN', () => {
    expect(listingSchema.safeParse({ ...ok, imagePaths: [] }).success).toBe(false);
    expect(listingSchema.safeParse({ ...ok, condition: 'broken' }).success).toBe(false);
    expect(listingSchema.safeParse({ ...ok, originalPrice: 100 }).success).toBe(false);
    expect(listingSchema.safeParse({ ...ok, pinCode: '012345' }).success).toBe(false);
    expect(listingSchema.safeParse({ ...ok, price: 1.5 }).success).toBe(false);
  });
});

describe('offer & report', () => {
  it('validates', () => {
    expect(offerSchema.safeParse({ productId: uuid, amount: 0 }).success).toBe(false);
    expect(offerSchema.safeParse({ productId: uuid, amount: 100 }).success).toBe(true);
    expect(reportSchema.safeParse({ targetType: 'product', targetId: uuid, reason: 'nonsense' }).success).toBe(false);
  });
});

describe('uploads', () => {
  it('checks mime and size', () => {
    expect(validateImageMeta('image/gif', 100).ok).toBe(false);
    expect(validateImageMeta('image/png', 6 * 1024 * 1024).ok).toBe(false);
    expect(validateImageMeta('image/webp', 1000).ok).toBe(true);
  });
  it('sniffs magic bytes', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe('image/png');
    expect(sniffImageType(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]))).toBe('image/webp');
    expect(sniffImageType(new Uint8Array([0x3c, 0x73, 0x76, 0x67]))).toBeNull();
  });
});

describe('sanitize', () => {
  it('removes control chars and angle brackets', () => {
    expect(sanitizePlainText('hi<script>\u0000x')).toBe('hiscriptx');
  });
});

import { listingFormSchema } from './index';
describe('listing form schema', () => {
  const f = { title: 'NCERT Physics Class 12', description: 'Good condition, no markings inside.', categorySlug: 'ncert-school', price: 200, condition: 'good', city: 'Kota', state: 'Rajasthan' };
  it('validates form fields without photos or backend ids', () => {
    expect(listingFormSchema.safeParse(f).success).toBe(true);
    expect(listingFormSchema.safeParse({ ...f, categorySlug: '' }).success).toBe(false);
    expect(listingFormSchema.safeParse({ ...f, originalPrice: 100 }).success).toBe(false);
  });
});
