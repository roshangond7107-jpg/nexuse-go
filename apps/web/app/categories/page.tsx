import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@nexuse/catalog';
export const metadata: Metadata = { title: 'All categories' };
export default function Categories() {
  return (
    <>
      <h1>All categories</h1>
      <div className="tiles">{CATEGORIES.map((c) => <Link key={c.slug} className="tile" href={`/category/${c.slug}`}><span className="em" aria-hidden="true">{c.emoji}</span><b>{c.name}</b><span>{c.blurb}</span></Link>)}</div>
    </>
  );
}
