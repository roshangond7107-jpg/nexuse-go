import { Pressable, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { CONDITION_LABELS, SORT_LABELS, parseSearchParams, type Condition, type Sort } from '@nexuse/catalog';
import SearchBar from '@/components/SearchBar';
import ListingsList from '@/components/ListingsList';
import { useTheme, spacing, radii } from '@/lib/theme';

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress}
    style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: selected ? t.primary : t.surfaceMuted }}><Text style={{ color: selected ? t.onPrimary : t.text, fontWeight: '600' }}>{label}</Text></Pressable>;
}

export default function Search() {
  const raw = useLocalSearchParams<Record<string, string>>();
  const p = parseSearchParams(raw as Record<string, string>);
  const setParam = (k: string, v: string | undefined) => router.setParams({ [k]: v });
  const header = (
    <View style={{ padding: spacing[2], gap: spacing[3] }}>
      <SearchBar initial={p.q} category={p.category ?? undefined} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }} accessibilityLabel="Condition filter">
        <Chip label="Any condition" selected={!p.condition} onPress={() => setParam('condition', undefined)} />
        {(Object.keys(CONDITION_LABELS) as Condition[]).map((c) => <Chip key={c} label={CONDITION_LABELS[c]} selected={p.condition === c} onPress={() => setParam('condition', c)} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }} accessibilityLabel="Sort order">
        {(Object.keys(SORT_LABELS) as Sort[]).map((s) => <Chip key={s} label={SORT_LABELS[s]} selected={p.sort === s} onPress={() => setParam('sort', s === 'newest' ? undefined : s)} />)}
      </View>
    </View>
  );
  return (<><Stack.Screen options={{ title: p.q ? `“${p.q}”` : 'Search' }} /><ListingsList params={p} header={header} /></>);
}
