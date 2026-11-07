import Link from 'next/link';
import { CATEGORIES, DEFAULT_SEARCH, FEATURES } from '@nexuse/catalog';
import { getRepository } from '@/lib/repository';
import Results from '@/components/Results';

const BUDGETS = [{ label: 'Under ₹200', max: 200 }, { label: '₹200 – ₹500', min: 200, max: 500 }, { label: '₹500 – ₹1,000', min: 500, max: 1000 }, { label: 'Above ₹1,000', min: 1000 }];
const CONDITIONS = [{ k: 'new', l: 'Brand new', e: '✨' }, { k: 'like_new', l: 'Like new', e: '👍' }, { k: 'good', l: 'Good', e: '🙂' }, { k: 'acceptable', l: 'Acceptable, best value', e: '♻️' }];

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div>
          <h1 id="hero-h">Study smarter. Spend less.</h1>
          <p>Buy. Sell. Reuse. Second-hand textbooks, exam material, calculators and study gear from students across India.</p>
          <div className="row"><Link className="btn" href="/categories">Browse categories</Link><Link className="btn" href="/sell">Sell an item</Link></div>
        </div>
      </section>

      {!FEATURES.browseListings && (
        <p className="notice" role="note"><b>Early preview.</b> Listings, sign-in and selling are being built and are not live yet. Nothing on this site is a real listing.</p>
      )}

      <section className="section" aria-labelledby="cat-h">
        <h2 id="cat-h">Shop by category</h2>
        <div className="tiles">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} className="tile" href={`/category/${c.slug}`}><span className="em" aria-hidden="true">{c.emoji}</span><b>{c.name}</b><span>{c.blurb}</span></Link>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="bud-h">
        <h2 id="bud-h">Shop by budget</h2>
        <div className="tiles">
          {BUDGETS.map((b) => (
            <Link key={b.label} className="tile" href={`/search?${new URLSearchParams({ ...(b.min ? { min: String(b.min) } : {}), ...(b.max ? { max: String(b.max) } : {}), sort: 'price_asc' })}`}><b>{b.label}</b><span>Lowest price first</span></Link>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="con-h">
        <h2 id="con-h">Shop by condition</h2>
        <div className="tiles">
          {CONDITIONS.map((c) => <Link key={c.k} className="tile" href={`/search?condition=${c.k}`}><span className="em" aria-hidden="true">{c.e}</span><b>{c.l}</b></Link>)}
        </div>
      </section>

      <section className="section" aria-labelledby="new-h">
        <h2 id="new-h">Fresh listings</h2>
        <Results repo={getRepository()} params={DEFAULT_SEARCH} basePath="/search" heading="Fresh listings" />
      </section>
    </>
  );
}
