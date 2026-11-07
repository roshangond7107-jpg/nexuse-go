import Link from 'next/link';
import { BRAND, COMING_SOON_COMMUNITIES } from '@nexuse/catalog';

export default function Footer() {
  const soon = COMING_SOON_COMMUNITIES();
  return (
    <footer className="ftr"><div className="container">
      <p><Link href="/categories">All categories</Link><Link href="/safety">Safety tips</Link><Link href="/sell">Sell an item</Link></p>
      {soon.length > 0 && (
        <p aria-label="Communities coming later">More communities coming later (not available yet): {soon.map((c) => c.name).join(', ')}.</p>
      )}
      <p>{BRAND.name} — {BRAND.tagline} © {new Date().getFullYear()} {BRAND.name}.</p>
    </div></footer>
  );
}
