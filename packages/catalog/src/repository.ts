import { BackendNotConfiguredError } from './loadable';
import type { Page, Product, SearchParams } from './types';

/** Data access contract. Batch 3 supplies a Supabase-backed implementation; Batch 2 ships none. */
export interface ListingsRepository {
  search(params: SearchParams, signal?: AbortSignal): Promise<Page<Product>>;
  getById(id: string, signal?: AbortSignal): Promise<Product>;
}

/** Used until a real backend is implemented and tested. Every call fails honestly. */
export const unconfiguredRepository: ListingsRepository = {
  async search() { throw new BackendNotConfiguredError(); },
  async getById() { throw new BackendNotConfiguredError(); },
};

/**
 * Feature truth table. A flag may only be flipped to true in the same change that
 * implements AND tests that feature end to end. UIs read this to decide what to enable.
 */
export const FEATURES = {
  browseListings: false,
  accountSignIn: false,
  publishListing: false,
  syncedWishlist: false,
  chat: false,
  checkout: false,
} as const;
export type FeatureName = keyof typeof FEATURES;
