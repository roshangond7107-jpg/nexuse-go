/**
 * ADVISORY heuristics that route listings to human review. They are NOT a
 * reliable filter and must never be the only safeguard.
 */
export type ProhibitedCategory = 'weapons' | 'drugs_alcohol_tobacco' | 'stolen_or_counterfeit' | 'adult' | 'exam_cheating' | 'off_platform_contact';

const RULES: { category: ProhibitedCategory; pattern: RegExp }[] = [
  { category: 'weapons', pattern: /\b(gun|pistol|revolver|firearm|ammunition|knife for sale|airgun|explosive|firecracker)\b/i },
  { category: 'drugs_alcohol_tobacco', pattern: /\b(weed|ganja|cannabis|cocaine|vape|e-?cigarette|cigarette|whisky|whiskey|vodka|beer|hookah)\b/i },
  { category: 'stolen_or_counterfeit', pattern: /\b(stolen|no bill|without bill|first copy|replica|master copy|duplicate brand|imei not available)\b/i },
  { category: 'adult', pattern: /\b(porn|adult toy|nsfw)\b/i },
  { category: 'exam_cheating', pattern: /\b(leaked paper|paper leak|cheating device|bluetooth chit|proxy exam|exam solver)\b/i },
  { category: 'off_platform_contact', pattern: /(\+?91[\s-]?)?[6-9]\d{9}|whats\s?app me|telegram\s?@|upi\s?id/i },
];

export interface ScanResult { flagged: boolean; categories: ProhibitedCategory[] }

export function scanListingText(...texts: (string | null | undefined)[]): ScanResult {
  const joined = texts.filter(Boolean).join(' \n ');
  const categories = RULES.filter((r) => r.pattern.test(joined)).map((r) => r.category);
  return { flagged: categories.length > 0, categories };
}
