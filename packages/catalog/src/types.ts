import type { ProductStatus } from '@nexuse/domain';
import type { CommunityId } from './communities';

export const CONDITION_LABELS = { new: 'New', like_new: 'Like new', good: 'Good', acceptable: 'Acceptable' } as const;
export type Condition = keyof typeof CONDITION_LABELS;

/** A real listing as returned by a ListingsRepository. The apps never fabricate these. */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;               // whole rupees
  originalPrice: number | null; // seller-declared only
  condition: Condition;
  communityId: CommunityId;
  categorySlug: string;
  city: string;
  state: string;
  imageUrls: readonly string[];
  sellerDisplayName: string;
  status: ProductStatus;
  createdAt: string;           // ISO-8601
}

export const SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABELS: Record<Sort, string> = { newest: 'Newest first', price_asc: 'Price: low to high', price_desc: 'Price: high to low' };

export interface SearchParams {
  community: CommunityId;
  q: string;
  category: string | null;
  condition: Condition | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: Sort;
  page: number; // 1-based
}
export const PAGE_SIZE = 24;
export interface Page<T> { items: readonly T[]; total: number; page: number; pageSize: number }
