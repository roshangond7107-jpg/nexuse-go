import { load, totalPages, toQueryString, type ListingsRepository, type Page, type Product, type SearchParams } from '@nexuse/catalog';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import { EmptyState, ErrorState } from './States';

/** Server component: fetches via the repository and renders success / empty / error states. */
export default async function Results({ repo, params, basePath, heading }: { repo: ListingsRepository; params: SearchParams; basePath: string; heading: string }) {
  const state = await load<Page<Product>>(() => repo.search(params), (d) => d.total === 0);
  if (state.status === 'error') return <ErrorState kind={state.kind} message={state.message} />;
  if (state.status === 'empty' || state.status === 'loading') {
    return <EmptyState title="No listings match" action={{ href: basePath, label: 'Clear filters' }}>Try a different search, fewer filters, or another category.</EmptyState>;
  }
  const { items, total, page, pageSize } = state.data;
  const pages = totalPages(total, pageSize);
  return (
    <>
      <p className="meta" role="status">{total} listing{total === 1 ? '' : 's'}</p>
      <ProductGrid products={items} label={heading} />
      <Pagination page={page} pages={pages} hrefFor={(n) => `${basePath}${toQueryString({ ...params, page: n })}`} />
    </>
  );
}
