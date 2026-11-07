export const PRODUCT_STATUSES = ['draft', 'pending_review', 'active', 'reserved', 'sold', 'rejected', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const T: Record<ProductStatus, readonly ProductStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['active', 'rejected', 'archived'],
  active: ['reserved', 'sold', 'archived', 'pending_review'],
  reserved: ['active', 'sold'],
  sold: [],
  rejected: ['draft', 'archived'],
  archived: ['draft'],
};

export function canTransition(from: ProductStatus, to: ProductStatus): boolean {
  return T[from].includes(to);
}
export function assertTransition(from: ProductStatus, to: ProductStatus): void {
  if (!canTransition(from, to)) throw new Error(`Illegal listing transition: ${from} -> ${to}`);
}
/** Only moderators may move pending_review -> active/rejected. */
export function requiresModerator(from: ProductStatus, to: ProductStatus): boolean {
  return from === 'pending_review' && (to === 'active' || to === 'rejected');
}
