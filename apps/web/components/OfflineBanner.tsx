'use client';
import { useSyncExternalStore } from 'react';

const sub = (cb: () => void) => { window.addEventListener('online', cb); window.addEventListener('offline', cb); return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); }; };
export function useOnline(): boolean { return useSyncExternalStore(sub, () => navigator.onLine, () => true); }

export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return <div className="offline" role="status" aria-live="polite">You are offline. Saved wishlist items are still available; browsing needs a connection.</div>;
}
