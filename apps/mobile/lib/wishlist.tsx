import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { WISHLIST_KEY, parseWishlist, serializeWishlist, toggleWishlist } from '@nexuse/catalog';

type Ctx = { ids: string[]; ready: boolean; has: (id: string) => boolean; toggle: (id: string) => void; clear: () => void };
const WishlistCtx = createContext<Ctx>({ ids: [], ready: false, has: () => false, toggle: () => {}, clear: () => {} });
export const useWishlist = () => useContext(WishlistCtx);

/** Device-local wishlist persisted in AsyncStorage; works offline. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(WISHLIST_KEY).then((raw) => setIds(parseWishlist(raw))).catch(() => {}).finally(() => setReady(true));
  }, []);
  const persist = useCallback((next: string[]) => { setIds(next); AsyncStorage.setItem(WISHLIST_KEY, serializeWishlist(next)).catch(() => {}); }, []);
  const value = useMemo<Ctx>(() => ({
    ids, ready, has: (id) => ids.includes(id),
    toggle: (id) => persist(toggleWishlist(ids, id)), clear: () => persist([]),
  }), [ids, ready, persist]);
  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}
