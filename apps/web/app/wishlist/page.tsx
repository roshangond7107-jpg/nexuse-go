import type { Metadata } from 'next';
import WishlistView from '@/components/WishlistView';
export const metadata: Metadata = { title: 'Wishlist' };
export default function Wishlist() { return (<><h1>Your wishlist</h1><WishlistView /></>); }
