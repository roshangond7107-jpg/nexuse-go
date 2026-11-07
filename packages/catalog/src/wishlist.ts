/** Device-local wishlist (product IDs only). Synced wishlist needs sign-in + backend (not built yet). */
export const WISHLIST_KEY = 'nexuse.wishlist.v1';
export const WISHLIST_MAX = 500;

export function parseWishlist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const ids = v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64);
    return [...new Set(ids)].slice(0, WISHLIST_MAX);
  } catch { return []; }
}
export const serializeWishlist = (ids: readonly string[]): string => JSON.stringify(ids.slice(0, WISHLIST_MAX));

/** Newest saved first. Returns same list if at capacity and id is new. */
export function toggleWishlist(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  if (ids.length >= WISHLIST_MAX) return [...ids];
  return [id, ...ids];
}
