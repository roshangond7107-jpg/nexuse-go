import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIES, COMING_SOON_COMMUNITIES } from '@nexuse/catalog';
import Screen from '@/components/Screen';
import { Body, Heading } from '@/components/ui';
import { useTheme, spacing, radii } from '@/lib/theme';

export default function Categories() {
  const t = useTheme();
  return (
    <Screen>
      <Heading>All categories</Heading>
      <View style={{ gap: spacing[2] }}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.slug} accessibilityRole="link" accessibilityLabel={`${c.name}. ${c.blurb}`} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: c.slug } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 64, padding: spacing[3], backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.lg }}>
            <Text style={{ fontSize: 28 }} importantForAccessibility="no">{c.emoji}</Text>
            <View style={{ flex: 1 }}><Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{c.name}</Text><Text style={{ color: t.textMuted, fontSize: 13 }}>{c.blurb}</Text></View>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: spacing[4] }}><Body muted>More communities coming later (not available yet): {COMING_SOON_COMMUNITIES().map((c) => c.name).join(', ')}.</Body></View>
    </Screen>
  );
}
