import Link from 'next/link';
import { conditionLabel, getCategory, priceView, relativeTime, productA11yLabel, type Product } from '@nexuse/catalog';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product: p }: { product: Product }) {
  const v = priceView(p);
  const img = p.imageUrls[0];
  return (
    <article className="card">
      <Link className="cover" href={`/product/${encodeURIComponent(p.id)}`} aria-label={productA11yLabel(p)}>
        <div className="ph">{img ? <img src={img} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{getCategory(p.categorySlug)?.emoji ?? '📦'}</span>}</div>
        <div className="body">
          <div className="t">{p.title}</div>
          <div><span className="price">{v.price}</span>{v.original && <span className="was"><span className="sr-only">Original price </span>{v.original}</span>}{v.discount != null && <span className="off">{v.discount}% off</span>}</div>
          <div className="meta"><span className="badge">{conditionLabel(p.condition)}</span> {p.city} · {relativeTime(p.createdAt)}</div>
        </div>
      </Link>
      <WishlistButton productId={p.id} title={p.title} />
    </article>
  );
}
