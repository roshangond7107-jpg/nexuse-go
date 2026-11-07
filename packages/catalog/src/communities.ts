/**
 * Multi-community configuration. One marketplace, many communities.
 * The database (`communities` table) is the runtime source of truth and lets admins
 * activate/deactivate communities; this file is the build-time default used by the apps
 * and the generator for supabase/seed.sql, so the two cannot drift (see scripts/generate-seed.ts).
 */
export const COMMUNITY_IDS = ['students', 'workers', 'families', 'professionals', 'small_businesses'] as const;
export type CommunityId = (typeof COMMUNITY_IDS)[number];
/** 'coming_soon' = announced but NOT functional: no categories, no listings, no search. */
export type CommunityStatus = 'active' | 'coming_soon' | 'inactive';

export interface Community { id: CommunityId; name: string; tagline: string; status: CommunityStatus; sortOrder: number }

export const BRAND = { name: 'NEXUSE GO', tagline: 'Buy. Sell. Reuse.', country: 'IN', currency: 'INR' } as const;
export const DEFAULT_COMMUNITY_ID: CommunityId = 'students';

export const COMMUNITIES: readonly Community[] = [
  { id: 'students', name: 'Students', tagline: 'Books, gear and essentials for school, college and exams', status: 'active', sortOrder: 1 },
  { id: 'workers', name: 'Workers', tagline: 'Workwear, tools and everyday essentials', status: 'coming_soon', sortOrder: 2 },
  { id: 'families', name: 'Families', tagline: 'Furniture, appliances, kids’ items and home essentials', status: 'coming_soon', sortOrder: 3 },
  { id: 'professionals', name: 'Professionals', tagline: 'Office furniture, computers and professional equipment', status: 'coming_soon', sortOrder: 4 },
  { id: 'small_businesses', name: 'Small businesses', tagline: 'A marketplace for eligible small shops', status: 'coming_soon', sortOrder: 5 },
];

export const getCommunity = (id: string): Community | undefined => COMMUNITIES.find((c) => c.id === id);
export const isCommunityActive = (id: string): boolean => getCommunity(id)?.status === 'active';
export const ACTIVE_COMMUNITIES = (): Community[] => COMMUNITIES.filter((c) => c.status === 'active');
export const COMING_SOON_COMMUNITIES = (): Community[] => COMMUNITIES.filter((c) => c.status === 'coming_soon');
