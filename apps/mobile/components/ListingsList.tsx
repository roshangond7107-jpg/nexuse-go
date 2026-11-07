import { FlatList, View } from 'react-native';
import type { SearchParams } from '@nexuse/catalog';
import { useListings } from '@/lib/useListings';
import { Button } from './ui';
import ProductCard from './ProductCard';
import { EmptyState, ErrorState, LoadingState } from './States';

/** Grid of listings with loading / empty / error (incl. offline) / load-more states. */
export default function ListingsList({ params, header, emptyHint }: { params: SearchParams; header?: React.ReactElement; emptyHint?: string }) {
  const { state, retry, loadMore } = useListings(params);
  const body = state.status === 'loading' ? <LoadingState />
    : state.status === 'error' ? <ErrorState kind={state.kind} message={state.message} onRetry={retry} />
    : state.status === 'empty' ? <EmptyState title="No listings match" message={emptyHint ?? 'Try a different search or category.'} /> : null;
  return (
    <FlatList
      data={state.status === 'success' ? state.items : []}
      keyExtractor={(p) => p.id} numColumns={2}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListHeaderComponent={header} ListEmptyComponent={body}
      ListFooterComponent={state.status === 'success' && state.hasMore ? <View style={{ padding: 16 }}><Button label={state.loadingMore ? 'Loading…' : 'Load more'} variant="outline" disabled={state.loadingMore} onPress={loadMore} /></View> : null}
      contentContainerStyle={{ padding: 8, paddingBottom: 32 }} keyboardShouldPersistTaps="handled"
    />
  );
}
