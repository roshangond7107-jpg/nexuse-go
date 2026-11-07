import { describe, it, expect } from 'vitest';
import { CATEGORIES, getCategory, parseSearchParams, toQueryString, totalPages, DEFAULT_SEARCH, load, classifyError, BackendNotConfiguredError, NotFoundError, unconfiguredRepository, FEATURES, parseWishlist, serializeWishlist, toggleWishlist, WISHLIST_MAX, priceView, relativeTime } from './index';
import { memoryRepository } from './testing/memory-repository';
import type { Product } from './types';

// TEST FIXTURES ONLY — not shown anywhere in the apps.
const fx = (o: Partial<Product>): Product => ({ id: 't1', title: 'Test book', description: 'desc', price: 200, originalPrice: null, condition: 'good', communityId: 'students', categorySlug: 'ncert-school', city: 'Kota', state: 'Rajasthan', imageUrls: [], sellerDisplayName: 'Tester', status: 'active', createdAt: '2025-01-01T00:00:00Z', ...o });

describe('categories', () => {
  it('has unique slugs', () => { expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length); });
  it('looks up by slug', () => { expect(getCategory('ncert-school')?.name).toBe('NCERT & school books'); expect(getCategory('nope')).toBeUndefined(); });
});

describe('parseSearchParams', () => {
  it('defaults', () => { expect(parseSearchParams({})).toEqual(DEFAULT_SEARCH); });
  it('parses valid input', () => {
    const p = parseSearchParams({ q: ' ncert ', category: 'ncert-school', condition: 'good', min: '100', max: '500', sort: 'price_asc', page: '2' });
    expect(p).toEqual({ community: 'students', q: 'ncert', category: 'ncert-school', condition: 'good', minPrice: 100, maxPrice: 500, sort: 'price_asc', page: 2 });
  });
  it('rejects hostile / invalid values', () => {
    const p = parseSearchParams({ q: '<script>x', category: '../etc', condition: 'broken', min: '-5', max: 'abc', sort: 'drop table', page: '0' });
    expect(p.q).toBe('scriptx'); expect(p.category).toBeNull(); expect(p.condition).toBeNull();
    expect(p.minPrice).toBeNull(); expect(p.maxPrice).toBeNull(); expect(p.sort).toBe('newest'); expect(p.page).toBe(1);
  });
  it('swaps inverted price range and reads URLSearchParams', () => {
    const p = parseSearchParams(new URLSearchParams('min=900&max=100'));
    expect(p.minPrice).toBe(100); expect(p.maxPrice).toBe(900);
  });
  it('round-trips through toQueryString', () => {
    const p = parseSearchParams({ q: 'physics', category: 'ncert-school', sort: 'price_desc', page: '3' });
    expect(parseSearchParams(new URLSearchParams(toQueryString(p)))).toEqual(p);
    expect(toQueryString(DEFAULT_SEARCH)).toBe('');
  });
  it('computes pages', () => { expect(totalPages(0)).toBe(1); expect(totalPages(25)).toBe(2); });
});

describe('loadable', () => {
  it('maps backend-not-configured to unavailable', async () => {
    const r = await load(() => unconfiguredRepository.search(DEFAULT_SEARCH));
    expect(r.status).toBe('error'); expect(r.status === 'error' && r.kind).toBe('unavailable');
  });
  it('maps not found / offline / unknown', () => {
    expect(classifyError(new NotFoundError()).kind).toBe('not_found');
    expect(classifyError(new Error('x'), false).kind).toBe('offline');
    expect(classifyError(new TypeError('Failed to fetch')).kind).toBe('offline');
    expect(classifyError(new Error('boom')).kind).toBe('unknown');
    expect(new BackendNotConfiguredError().message).toMatch(/not connected/);
  });
  it('reports empty and success', async () => {
    expect((await load(async () => [], (d) => d.length === 0)).status).toBe('empty');
    expect((await load(async () => [1], (d) => d.length === 0)).status).toBe('success');
  });
});

describe('feature truth table', () => {
  it('has no feature enabled before it is implemented and tested', () => { expect(Object.values(FEATURES).every((v) => v === false)).toBe(true); });
});

describe('wishlist', () => {
  it('toggles, newest first', () => { expect(toggleWishlist(['a'], 'b')).toEqual(['b', 'a']); expect(toggleWishlist(['b', 'a'], 'b')).toEqual(['a']); });
  it('survives corrupt storage', () => {
    expect(parseWishlist('not json')).toEqual([]); expect(parseWishlist('{"a":1}')).toEqual([]);
    expect(parseWishlist(JSON.stringify(['a', 'a', 1, '', 'b']))).toEqual(['a', 'b']);
    expect(parseWishlist(null)).toEqual([]);
  });
  it('caps size', () => {
    const many = Array.from({ length: WISHLIST_MAX }, (_, i) => `id${i}`);
    expect(toggleWishlist(many, 'new')).toHaveLength(WISHLIST_MAX);
    expect(JSON.parse(serializeWishlist([...many, 'x']))).toHaveLength(WISHLIST_MAX);
  });
});

describe('format', () => {
  it('shows discount only for a declared higher original price', () => {
    expect(priceView({ price: 400, originalPrice: 500 }).discount).toBe(20);
    expect(priceView({ price: 400, originalPrice: null }).discount).toBeNull();
    expect(priceView({ price: 0, originalPrice: null }).price).toBe('Free');
  });
  it('formats relative time', () => {
    const now = new Date('2025-01-10T12:00:00Z');
    expect(relativeTime('2025-01-10T11:59:30Z', now)).toBe('Just now');
    expect(relativeTime('2025-01-10T10:00:00Z', now)).toBe('2 h ago');
    expect(relativeTime('2025-01-09T10:00:00Z', now)).toBe('1 day ago');
    expect(relativeTime('garbage', now)).toBe('');
  });
});

describe('memory repository (test double)', () => {
  const repo = memoryRepository([fx({ id: 'a', price: 100 }), fx({ id: 'b', price: 300, title: 'Chemistry', condition: 'new' }), fx({ id: 'c', status: 'draft' })]);
  it('hides non-active, filters and sorts', async () => {
    expect((await repo.search(DEFAULT_SEARCH)).total).toBe(2);
    expect((await repo.search({ ...DEFAULT_SEARCH, q: 'chem' })).items[0]?.id).toBe('b');
    expect((await repo.search({ ...DEFAULT_SEARCH, sort: 'price_desc' })).items[0]?.id).toBe('b');
    expect((await repo.search({ ...DEFAULT_SEARCH, condition: 'new' })).total).toBe(1);
  });
  it('404s for non-active', async () => { let e: unknown; try { await repo.getById('c'); } catch (x) { e = x; } expect(e instanceof NotFoundError).toBe(true); });
});

import { COMMUNITIES, COMMUNITY_IDS, isCommunityActive, ACTIVE_COMMUNITIES, categoriesFor, CATEGORIES_ALL, childrenOf } from './index';
describe('communities', () => {
  it('launches with Students as the only active community', () => {
    expect(ACTIVE_COMMUNITIES().map((c) => c.id)).toEqual(['students']);
    expect(COMMUNITIES.map((c) => c.id)).toEqual([...COMMUNITY_IDS]);
    for (const id of ['workers', 'families', 'professionals', 'small_businesses']) expect(isCommunityActive(id)).toBe(false);
  });
  it('inactive communities expose no categories (not a functional marketplace)', () => {
    expect(categoriesFor('workers')).toHaveLength(0);
    expect(getCategory('ncert-school', 'workers')).toBeUndefined();
  });
  it('student categories cover the required set with subcategories; slugs unique per community', () => {
    expect(categoriesFor('students').filter((c) => !c.parentSlug)).toHaveLength(14);
    expect(childrenOf('exam-material').map((c) => c.slug)).toEqual(['neet', 'jee', 'upsc', 'cuet-other']);
    expect(new Set(CATEGORIES_ALL.map((c) => `${c.communityId}/${c.slug}`)).size).toBe(CATEGORIES_ALL.length);
  });
  it('ignores inactive community in URL params', () => {
    expect(parseSearchParams({ community: 'workers' }).community).toBe('students');
    expect(parseSearchParams({ community: 'students', category: 'neet' }).category).toBe('neet');
  });
  it('memory repository scopes search by community', async () => {
    const repo = memoryRepository([fx({ id: 'a' }), fx({ id: 'w', communityId: 'workers' })]);
    expect((await repo.search(DEFAULT_SEARCH)).total).toBe(1);
  });
});
