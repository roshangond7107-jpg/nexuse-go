import { discountPercent, formatINR } from '@nexuse/domain';
import { CONDITION_LABELS, type Product } from './types';

export const conditionLabel = (c: keyof typeof CONDITION_LABELS) => CONDITION_LABELS[c];

export function priceView(p: Pick<Product, 'price' | 'originalPrice'>) {
  const off = discountPercent(p.price, p.originalPrice);
  return {
    price: p.price === 0 ? 'Free' : formatINR(p.price),
    original: off != null && p.originalPrice != null ? formatINR(p.originalPrice) : null,
    discount: off, // only when seller declared a higher original price
  };
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((now.getTime() - t) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Accessible one-line description for screen readers. */
export function productA11yLabel(p: Product): string {
  const v = priceView(p);
  return `${p.title}, ${v.price}, ${conditionLabel(p.condition)}, ${p.city}`;
}
