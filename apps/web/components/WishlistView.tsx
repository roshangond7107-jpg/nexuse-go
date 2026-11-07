'use client';
import Link from 'next/link';
import { useWishlist } from '@/lib/wishlist-store';
import { EmptyState } from './States';

export default function WishlistView() {
  const { ids, clear } = useWishlist();
  if (ids.length === 0) return <EmptyState title="Nothing saved yet" action={{ href: '/categories', label: 'Browse categories' }}>Tap the heart on any listing to save it here. Saved items stay on this device.</EmptyState>;
  return (
    <>
      <p className="notice">Saved on this device only. Listing details can’t be loaded until the marketplace service is connected; your saved items are kept.</p>
      <ul className="list" aria-label="Saved listings">
        {ids.map((id) => <li key={id}><Link href={`/product/${encodeURIComponent(id)}`}>Listing {id.slice(0, 8)}…</Link></li>)}
      </ul>
      <p><button className="btn alt" type="button" onClick={clear}>Clear wishlist</button></p>
    </>
  );
}
