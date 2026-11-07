import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getCategory, parseSearchParams } from '@nexuse/catalog';
import ListingsList from '@/components/ListingsList';
import { EmptyState } from '@/components/States';
import { useTheme } from '@/lib/theme';

export default function CategoryScreen() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cat = getCategory(String(slug));
  if (!cat) return <EmptyState title="Category not found" message="That category doesn’t exist." />;
  const params = { ...parseSearchParams({}), category: cat.slug };
  const header = <View style={{ padding: 8 }}><Text accessibilityRole="header" style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>{cat.emoji} {cat.name}</Text><Text style={{ color: t.textMuted }}>{cat.blurb}</Text></View>;
  return (<><Stack.Screen options={{ title: cat.name }} /><ListingsList params={params} header={header} emptyHint={`No ${cat.name.toLowerCase()} listings yet.`} /></>);
}
