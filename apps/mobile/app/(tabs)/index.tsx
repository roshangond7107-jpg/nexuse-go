import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIES, DEFAULT_SEARCH, FEATURES } from '@nexuse/catalog';
import SearchBar from '@/components/SearchBar';
import ListingsList from '@/components/ListingsList';
import { Heading, Notice } from '@/components/ui';
import { useTheme, spacing, radii } from '@/lib/theme';

const BUDGETS = [{ label: 'Under ₹200', max: '200' }, { label: '₹200–500', min: '200', max: '500' }, { label: '₹500–1,000', min: '500', max: '1000' }, { label: 'Above ₹1,000', min: '1000' }] as const;

export default function Home() {
  const t = useTheme();
  const header = (
    <View style={{ padding: spacing[2], gap: spacing[3] }}>
      <SearchBar />
      <View style={{ backgroundColor: t.primary, borderRadius: radii.lg, padding: spacing[5] }}>
        <Text style={{ color: t.onPrimary, fontSize: 24, fontWeight: '800' }}>Study smarter. Spend less.</Text>
        <Text style={{ color: t.onPrimary, marginTop: 4 }}>Buy. Sell. Reuse. Second-hand books, exam material, calculators and study gear.</Text>
      </View>
      {!FEATURES.browseListings && <Notice><Text style={{ fontWeight: '800' }}>Early preview.</Text> Listings, sign-in and selling are being built and are not live yet. Nothing in this app is a real listing.</Notice>}
      <Heading level={2}>Shop by category</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }} accessibilityLabel="Categories">
        {CATEGORIES.map((c) => (
          <Pressable key={c.slug} accessibilityRole="link" accessibilityLabel={c.name} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })}
            style={{ width: 84, minHeight: 84, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.lg, padding: 6 }}>
            <Text style={{ fontSize: 26 }} importantForAccessibility="no">{c.emoji}</Text><Text numberOfLines={2} style={{ color: t.text, fontSize: 12, textAlign: 'center' }}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Heading level={2}>Shop by budget</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
        {BUDGETS.map((b) => (
          <Pressable key={b.label} accessibilityRole="link" accessibilityLabel={`${b.label}, lowest price first`}
            onPress={() => router.push({ pathname: '/search', params: { ...('min' in b ? { min: b.min } : {}), ...('max' in b ? { max: b.max } : {}), sort: 'price_asc' } })}
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: t.surfaceMuted, borderRadius: radii.pill }}><Text style={{ color: t.text, fontWeight: '600' }}>{b.label}</Text></Pressable>
        ))}
      </View>
      <Heading level={2}>Fresh listings</Heading>
    </View>
  );
  return <ListingsList params={DEFAULT_SEARCH} header={header} />;
}
