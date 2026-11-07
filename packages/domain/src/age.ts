/** Age rules. Under 18 = child under India's DPDP Act 2023 (legal review required). */
export const ADULT_AGE = 18;

export function calculateAge(dob: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

export function isMinor(dob: Date, now: Date = new Date()): boolean {
  if (dob.getTime() > now.getTime()) throw new Error('Date of birth is in the future');
  return calculateAge(dob, now) < ADULT_AGE;
}

export type AccountRestriction = 'none' | 'minor_pending_guardian' | 'minor_guardian_verified';

export function restrictionFor(dob: Date, guardianVerified: boolean, now: Date = new Date()): AccountRestriction {
  if (!isMinor(dob, now)) return 'none';
  return guardianVerified ? 'minor_guardian_verified' : 'minor_pending_guardian';
}

/** What a restricted account may do. Minors never get unrestricted chat with adults. */
export function capabilities(r: AccountRestriction) {
  return {
    canBrowse: true,
    canWishlist: true,
    canChat: r === 'none' || r === 'minor_guardian_verified',
    canSell: r === 'none' || r === 'minor_guardian_verified',
    canSeeTargetedContent: r === 'none', // no tracking/targeted ads for children
  };
}
