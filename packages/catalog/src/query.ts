import { categoriesFor } from './categories';
import { DEFAULT_COMMUNITY_ID, isCommunityActive, type CommunityId } from './communities';
import { CONDITION_LABELS, SORTS, PAGE_SIZE, type Condition, type SearchParams, type Sort } from './types';

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function pick(raw: Raw, key: string): string | undefined {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}
function intOrNull(v: string | undefined, max = 10_000_000): number | null {
  if (v == null || !/^\d{1,8}$/.test(v)) return null;
  const n = Number(v);
  return n <= max ? n : null;
}

export const DEFAULT_SEARCH: SearchParams = { community: DEFAULT_COMMUNITY_ID, q: '', category: null, condition: null, minPrice: null, maxPrice: null, sort: 'newest', page: 1 };

/** Parses untrusted URL input into a safe SearchParams. Unknown/invalid values fall back to defaults. */
export function parseSearchParams(raw: Raw): SearchParams {
  const q = (pick(raw, 'q') ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 100);
  const comm = pick(raw, 'community');
  const community: CommunityId = comm && isCommunityActive(comm) ? (comm as CommunityId) : DEFAULT_COMMUNITY_ID;
  const cat = pick(raw, 'category');
  const cond = pick(raw, 'condition');
  const sort = pick(raw, 'sort');
  let minPrice = intOrNull(pick(raw, 'min'));
  let maxPrice = intOrNull(pick(raw, 'max'));
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  const page = intOrNull(pick(raw, 'page'), 10_000);
  return {
    community, q,
    category: cat && categoriesFor(community).some((c) => c.slug === cat) ? cat : null,
    condition: cond && cond in CONDITION_LABELS ? (cond as Condition) : null,
    minPrice, maxPrice,
    sort: sort && (SORTS as readonly string[]).includes(sort) ? (sort as Sort) : 'newest',
    page: page && page >= 1 ? page : 1,
  };
}

/** Inverse of parseSearchParams; omits defaults so URLs stay short. */
export function toQueryString(p: Partial<SearchParams>): string {
  const u = new URLSearchParams();
  if (p.community && p.community !== DEFAULT_COMMUNITY_ID) u.set('community', p.community);
  if (p.q) u.set('q', p.q);
  if (p.category) u.set('category', p.category);
  if (p.condition) u.set('condition', p.condition);
  if (p.minPrice != null) u.set('min', String(p.minPrice));
  if (p.maxPrice != null) u.set('max', String(p.maxPrice));
  if (p.sort && p.sort !== 'newest') u.set('sort', p.sort);
  if (p.page && p.page > 1) u.set('page', String(p.page));
  const s = u.toString();
  return s ? `?${s}` : '';
}

export function totalPages(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
