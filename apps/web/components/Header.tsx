import Link from 'next/link';
import { CATEGORIES } from '@nexuse/catalog';
import Logo from './Logo';

export default function Header() {
  return (
    <header>
      <div className="hdr">
        <div className="container hdr-row">
          <Link href="/" aria-label="NEXUSE GO home"><Logo /></Link>
          <form className="search" role="search" action="/search" method="get">
            <label className="sr-only" htmlFor="hq-cat">Category</label>
            <select id="hq-cat" name="category" defaultValue="">
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="hq">Search study items</label>
            <input id="hq" name="q" type="search" placeholder="Search books, calculators, notes…" maxLength={100} autoComplete="off" />
            <button type="submit">Search</button>
          </form>
          <nav className="nav" aria-label="Primary">
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/account">Account</Link>
            <Link href="/sell" className="sell">Sell</Link>
          </nav>
        </div>
      </div>
      <nav className="cats" aria-label="Categories">
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c.slug}><Link href={`/category/${c.slug}`}><span className="em" aria-hidden="true">{c.emoji}</span>{c.name}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
