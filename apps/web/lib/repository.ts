import { unconfiguredRepository, type ListingsRepository } from '@nexuse/catalog';

/**
 * Batch 2 ships no backend. This always returns the "not connected" repository so every
 * page shows an honest unavailable state. Batch 3 swaps in a Supabase-backed repository
 * (using only the public anon key + RLS) and flips the matching FEATURES flag.
 */
export function getRepository(): ListingsRepository { return unconfiguredRepository; }
