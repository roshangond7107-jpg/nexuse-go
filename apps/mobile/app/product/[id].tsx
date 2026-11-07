import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { classifyError, conditionLabel, getCategory, priceView, relativeTime, type ErrorKind, type Product } from '@nexuse/catalog';
import Screen from '@/components/Screen';
import { Body, Button, Heading, Notice } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/States';
import { repository } from '@/lib/repository';
import { useOnline } from '@/lib/useOnline';
import { useTheme, radii } from '@/lib/theme';
import { useWishlist } from '@/lib/wishlist';

type S = { s: 'loading' } | { s: 'ok'; p: Product } | { s: 'err'; kind: ErrorKind; message: string };

export default function ProductScreen() {
  const t = useTheme(); const online = useOnline(); const { has, toggle } = useWishlist();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [st, setSt] = useState<S>({ s: 'loading' });
  const load = useCallback(async () => {
    setSt({ s: 'loading' });
    try { setSt({ s: 'ok', p: await repository.getById(String(id)) }); } catch (e) { setSt({ s: 'err', ...classifyError(e, online) }); }
  }, [id, online]);
  useEffect(() => { load(); }, [load]);

  if (st.s === 'loading') return <LoadingState label="Loading listing…" />;
  if (st.s === 'err') return <ErrorState kind={st.kind} message={st.message} onRetry={load} />;
  const p = st.p; const v = priceView(p); const saved = has(p.id);
  return (
    <Screen>
      <Stack.Screen options={{ title: p.title }} />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} accessibilityLabel="Photos">
        {p.imageUrls.length ? p.imageUrls.map((u, i) => <Image key={u} source={{ uri: u }} accessibilityLabel={`${p.title}, photo ${i + 1} of ${p.imageUrls.length}`} style={{ width: 320, height: 400, borderRadius: radii.lg, marginRight: 8, backgroundColor: t.surfaceMuted }} />)
          : <View style={{ width: 320, height: 200, borderRadius: radii.lg, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.textMuted }}>No photos provided</Text></View>}
      </ScrollView>
      <View style={{ marginTop: 16 }}>
        <Heading>{p.title}</Heading>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>{v.price}{v.original ? <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: '400', textDecorationLine: 'line-through' }}>  {v.original}</Text> : null}{v.discount != null ? <Text style={{ color: t.accent, fontSize: 14 }}>  {v.discount}% off</Text> : null}</Text>
        <Body muted>{conditionLabel(p.condition)} · {p.city}, {p.state} · {getCategory(p.categorySlug)?.name} · listed {relativeTime(p.createdAt)}</Body>
        <View style={{ height: 12 }} />
        <Button label={saved ? 'Remove from wishlist' : 'Save to wishlist'} variant="outline" onPress={() => toggle(p.id)} />
        <Heading level={2}>Description</Heading><Body>{p.description}</Body>
        <View style={{ height: 8 }} /><Body muted>Seller: {p.sellerDisplayName} (self-declared, not verified)</Body>
        <Notice>Chat and checkout are not available yet. Meet in a public place and inspect items before paying.</Notice>
      </View>
    </Screen>
  );
}
