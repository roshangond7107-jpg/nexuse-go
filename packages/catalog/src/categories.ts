import { DEFAULT_COMMUNITY_ID, isCommunityActive, type CommunityId } from './communities';

/**
 * Community-scoped categories (two levels). Slugs are unique within a community and are the
 * stable URL key. The backend `categories` table owns the UUIDs; apps map slug -> id from the DB.
 * Only ACTIVE communities have categories here: a coming-soon community is not a marketplace.
 */
export interface Category {
  slug: string; name: string; blurb: string; emoji: string;
  communityId: CommunityId; parentSlug?: string; sortOrder: number; keywords: readonly string[];
}

type Def = [slug: string, name: string, blurb: string, emoji: string, keywords: string[], parent?: string];
const STUDENT_DEFS: Def[] = [
  ['ncert-school', 'NCERT & school books', 'NCERT and school textbooks', '📚', ['ncert', 'school', 'textbook', 'cbse', 'icse']],
  ['college-books', 'College & university books', 'Degree, engineering, medical and law books', '🎓', ['college', 'university', 'engineering', 'reference']],
  ['exam-material', 'Exam preparation', 'NEET, JEE, UPSC, CUET and other exams', '🎯', ['neet', 'jee', 'upsc', 'cuet', 'module', 'mock']],
  ['stationery', 'Stationery & study supplies', 'Pens, files, geometry boxes, notebooks', '✏️', ['pen', 'file', 'geometry', 'notebook']],
  ['calculators-equipment', 'Calculators & equipment', 'Scientific calculators, drafters, lab gear', '🧮', ['calculator', 'casio', 'drafter', 'lab']],
  ['laptops-tablets', 'Laptops, tablets & accessories', 'Laptops, tablets, chargers, cases', '💻', ['laptop', 'tablet', 'ipad', 'charger']],
  ['phones-electronics', 'Phones & electronics', 'Phones, headphones, e-readers, power banks', '📱', ['phone', 'headphones', 'kindle', 'power bank']],
  ['hostel-essentials', 'Hostel essentials', 'Mattresses, buckets, lamps, storage', '🛏️', ['hostel', 'mattress', 'lamp']],
  ['furniture', 'Furniture', 'Study tables, chairs, shelves', '🪑', ['table', 'chair', 'shelf']],
  ['bags', 'Bags & backpacks', 'Backpacks, laptop bags, duffels', '🎒', ['bag', 'backpack']],
  ['clothing', 'Clothing', 'Uniforms, jackets, lab coats, everyday wear', '👕', ['uniform', 'jacket', 'lab coat']],
  ['sports-hobby', 'Sports & hobby', 'Sports gear, instruments, art supplies', '🏏', ['cricket', 'badminton', 'guitar', 'sketch']],
  ['kitchen-daily', 'Kitchen & daily essentials', 'Cookers, kettles, utensils, daily-use items', '🍳', ['kettle', 'cooker', 'utensil']],
  ['other-student', 'Other student products', 'Other legitimate items students need', '🧰', []],
  ['neet', 'NEET', 'Medical entrance material', '🩺', ['neet', 'biology'], 'exam-material'],
  ['jee', 'JEE', 'Engineering entrance material', '⚙️', ['jee', 'iit'], 'exam-material'],
  ['upsc', 'UPSC & civil services', 'Civil services material', '🏛️', ['upsc', 'ias'], 'exam-material'],
  ['cuet-other', 'CUET & other exams', 'CUET, CLAT, banking, SSC and more', '📝', ['cuet', 'clat', 'ssc', 'bank'], 'exam-material'],
];

export const CATEGORIES_ALL: readonly Category[] = STUDENT_DEFS.map(([slug, name, blurb, emoji, keywords, parentSlug], i) => ({
  slug, name, blurb, emoji, keywords, communityId: 'students' as const, sortOrder: i + 1, ...(parentSlug ? { parentSlug } : {}),
}));

/** Categories of a community; [] unless the community is active. */
export function categoriesFor(communityId: string): Category[] {
  return isCommunityActive(communityId) ? CATEGORIES_ALL.filter((c) => c.communityId === communityId) : [];
}
/** Top-level categories of the default (active) community — what the apps render in navigation. */
export const CATEGORIES: readonly Category[] = categoriesFor(DEFAULT_COMMUNITY_ID).filter((c) => !c.parentSlug);
export const childrenOf = (slug: string, communityId: string = DEFAULT_COMMUNITY_ID): Category[] => categoriesFor(communityId).filter((c) => c.parentSlug === slug);

export function getCategory(slug: string, communityId: string = DEFAULT_COMMUNITY_ID): Category | undefined {
  return categoriesFor(communityId).find((c) => c.slug === slug);
}
