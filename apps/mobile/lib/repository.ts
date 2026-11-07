import { unconfiguredRepository, type ListingsRepository } from '@nexuse/catalog';
/** Batch 2 ships no backend: every call reports "not connected". Batch 3 replaces this (anon key + RLS only; never a service-role key in the app). */
export const repository: ListingsRepository = unconfiguredRepository;
