import { z } from 'zod';
import { isMinor } from '@nexuse/domain';

/** Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX). Returns null if invalid. */
export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, '');
  const m = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(digits);
  return m ? `+91${m[1]}` : null;
}

export const phoneSchema = z.string().trim().transform((v, ctx) => {
  const n = normalizeIndianPhone(v);
  if (!n) { ctx.addIssue({ code: 'custom', message: 'Enter a valid Indian mobile number' }); return z.NEVER; }
  return n;
});
export const otpSchema = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');
export const pinCodeSchema = z.string().regex(/^[1-9]\d{5}$/, 'Invalid PIN code');

export const sendOtpSchema = z.object({ phone: phoneSchema, captchaToken: z.string().min(1) });
export const verifyOtpSchema = z.object({ phone: phoneSchema, token: otpSchema });

const dobSchema = z.coerce.date().refine((d) => d.getTime() <= Date.now(), 'Date of birth cannot be in the future')
  .refine((d) => d.getUTCFullYear() >= 1940, 'Invalid date of birth');

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  dateOfBirth: dobSchema,
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  institution: z.string().trim().max(120).optional(), // self-declared, never shown as verified
  acceptedTerms: z.literal(true),
}).transform((p) => ({ ...p, isMinor: isMinor(p.dateOfBirth) }));

export const CONDITIONS = ['new', 'like_new', 'good', 'acceptable'] as const;

const listingShape = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(4000),
  categoryId: z.string().uuid(),
  price: z.number().int().min(0).max(10_000_000),
  originalPrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  condition: z.enum(CONDITIONS),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pinCode: pinCodeSchema.optional(),
  quantity: z.number().int().min(1).max(999).default(1),
  imagePaths: z.array(z.string().min(1)).min(1, 'Add at least one photo').max(8),
});
const originalPriceRule = {
  check: (l: { price: number; originalPrice?: number | null }) => l.originalPrice == null || l.originalPrice >= l.price,
  opts: { path: ['originalPrice'], message: 'Original price cannot be below selling price' },
};

export const listingSchema = listingShape.refine(originalPriceRule.check, originalPriceRule.opts);

/** Client-side form validation (before photos are uploaded and categories resolved to backend IDs). The server still validates with listingSchema. */
export const listingFormSchema = listingShape
  .omit({ categoryId: true, imagePaths: true })
  .extend({ categorySlug: z.string().min(1, 'Choose a category') })
  .refine(originalPriceRule.check, originalPriceRule.opts);

export const offerSchema = z.object({ productId: z.string().uuid(), amount: z.number().int().positive() });
export const messageSchema = z.object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(2000) });
export const REPORT_REASONS = ['illegal', 'counterfeit', 'stolen', 'dangerous', 'fraud', 'misleading', 'harassment', 'scam', 'unsafe_meeting', 'other'] as const;
export const reportSchema = z.object({
  targetType: z.enum(['product', 'user', 'conversation', 'message']),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function validateImageMeta(mime: string, bytes: number): { ok: boolean; error?: string } {
  if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)) return { ok: false, error: 'Only JPEG, PNG or WebP images are allowed' };
  if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) return { ok: false, error: 'Image must be under 5 MB' };
  return { ok: true };
}
/** Server must ALSO check magic bytes; client MIME is spoofable. */
export function sniffImageType(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

/** Strips control chars and angle brackets from plain-text user content before storage. React/Next escape on render; this is defence in depth. */
export function sanitizePlainText(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[<>]/g, '');
}
