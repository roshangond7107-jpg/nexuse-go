'use client';
import { useSyncExternalStore } from 'react';
import { WISHLIST_KEY, parseWishlist, serializeWishlist, toggleWishlist } from '@nexuse/catalog';

const listeners = new Set<() => void>();
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: [] };
const EMPTY: string[] = [];

function readRaw(): string | null { try { return localStorage.getItem(WISHLIST_KEY); } catch { return null; } }
function snapshot(): string[] {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, ids: parseWishlist(raw) };
  return cache.ids;
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === WISHLIST_KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}

/** Device-local wishlist. Works offline; storage failures (private mode) degrade to "not saved". */
export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = (id: string) => {
    try { localStorage.setItem(WISHLIST_KEY, serializeWishlist(toggleWishlist(snapshot(), id))); } catch { /* storage blocked */ }
    listeners.forEach((l) => l());
  };
  const clear = () => { try { localStorage.removeItem(WISHLIST_KEY); } catch { /* ignore */ } listeners.forEach((l) => l()); };
  return { ids, has: (id: string) => ids.includes(id), toggle, clear };
}
