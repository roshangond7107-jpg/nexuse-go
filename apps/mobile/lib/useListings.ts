import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyError, type ErrorKind, type Product, type SearchParams } from '@nexuse/catalog';
import { repository } from './repository';
import { useOnline } from './useOnline';

export type ListingsState =
  | { status: 'loading' } | { status: 'empty' }
  | { status: 'error'; kind: ErrorKind; message: string }
  | { status: 'success'; items: Product[]; total: number; hasMore: boolean; loadingMore: boolean };

/** Loads page 1 for the given params and supports "load more". */
export function useListings(params: SearchParams) {
  const [state, setState] = useState<ListingsState>({ status: 'loading' });
  const online = useOnline();
  const key = JSON.stringify({ ...params, page: 1 });
  const page = useRef(1);

  const run = useCallback(async (append: boolean) => {
    const p = append ? page.current + 1 : 1;
    if (!append) setState({ status: 'loading' });
    else setState((s) => (s.status === 'success' ? { ...s, loadingMore: true } : s));
    try {
      const r = await repository.search({ ...params, page: p });
      page.current = p;
      setState((s) => {
        const prev = append && s.status === 'success' ? s.items : [];
        const items = [...prev, ...r.items];
        if (items.length === 0) return { status: 'empty' };
        return { status: 'success', items, total: r.total, hasMore: items.length < r.total, loadingMore: false };
      });
    } catch (e) {
      const c = classifyError(e, online);
      setState((s) => (append && s.status === 'success' ? { ...s, loadingMore: false } : { status: 'error', ...c }));
    }
  }, [key, online]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run(false); }, [run]);
  return { state, retry: () => run(false), loadMore: () => run(true) };
}
