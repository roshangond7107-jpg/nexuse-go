import type { Product } from '@nexuse/catalog';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, label }: { products: readonly Product[]; label: string }) {
  return <ul className="grid" aria-label={label}>{products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>;
}
