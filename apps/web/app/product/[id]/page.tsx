import type { Metadata } from 'next';
import Link from 'next/link';
import { conditionLabel, getCategory, load, priceView, relativeTime, type Product } from '@nexuse/catalog';
import { getRepository } from '@/lib/repository';
import { ErrorState } from '@/components/States';
import WishlistButton from '@/components/WishlistButton';

type Props = { params: Promise<{ id: string }> };
const okId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  if (!okId(id)) return { title: 'Listing not found' };
  const s = await load<Product>(() => getRepository().getById(id));
  return { title: s.status === 'success' ? s.data.title : 'Listing' };
}

export default async function ProductPage({ params }: Props) {
  const id = (await params).id;
  const s = okId(id) ? await load<Product>(() => getRepository().getById(id)) : ({ status: 'error', kind: 'not_found', message: 'This listing could not be found.' } as const);
  if (s.status !== 'success') return <ErrorState kind={s.status === 'error' ? s.kind : 'unknown'} message={s.status === 'error' ? s.message : 'Unable to load this listing.'} />;
  const p = s.data; const v = priceView(p); const cat = getCategory(p.categorySlug);
  return (
    <>
      <p className="breadcrumb"><Link href="/">Home</Link> › {cat ? <Link href={`/category/${cat.slug}`}>{cat.name}</Link> : 'Listing'}</p>
      <div className="pd">
        <div className="gallery" role="group" aria-label="Photos">
          {p.imageUrls.length ? p.imageUrls.map((u, i) => <img key={u} src={u} alt={`${p.title} — photo ${i + 1} of ${p.imageUrls.length}`} loading={i ? 'lazy' : 'eager'} />) : <div className="state">No photos provided</div>}
        </div>
        <div>
          <h1>{p.title}</h1>
          <p><span className="price" style={{ fontSize: '1.6rem' }}>{v.price}</span>{v.original && <span className="was"><span className="sr-only">Original price </span>{v.original}</span>}{v.discount != null && <span className="off">{v.discount}% off</span>}</p>
          <p><span className="badge">{conditionLabel(p.condition)}</span> <span className="meta">{p.city}, {p.state} · listed {relativeTime(p.createdAt)}</span></p>
          <div style={{ position: 'relative', height: 52 }}><WishlistButton productId={p.id} title={p.title} /></div>
          <h2>Description</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{p.description}</p>
          <p className="meta">Seller: {p.sellerDisplayName} (self-declared, not verified)</p>
          <p className="notice">Chat and checkout are not available yet. <Link href="/safety">Read safety tips</Link> before meeting anyone.</p>
        </div>
      </div>
    </>
  );
}
