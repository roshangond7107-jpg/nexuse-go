'use client';
import { useWishlist } from '@/lib/wishlist-store';

export default function WishlistButton({ productId, title }: { productId: string; title: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button type="button" className="heart" aria-pressed={saved} aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`} onClick={() => toggle(productId)}>
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
    </button>
  );
}
