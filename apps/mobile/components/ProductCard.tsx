import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { conditionLabel, getCategory, priceView, relativeTime, productA11yLabel, type Product } from '@nexuse/catalog';
import { useTheme, spacing, radii } from '@/lib/theme';
import { useWishlist } from '@/lib/wishlist';

export default function ProductCard({ product: p }: { product: Product }) {
  const t = useTheme(); const { has, toggle } = useWishlist();
  const v = priceView(p); const saved = has(p.id); const img = p.imageUrls[0];
  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable accessibilityRole="link" accessibilityLabel={productA11yLabel(p)} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}>
        <View style={[s.ph, { backgroundColor: t.surfaceMuted }]}>
          {img ? <Image source={{ uri: img }} style={s.img} accessibilityIgnoresInvertColors /> : <Text style={{ fontSize: 40 }}>{getCategory(p.categorySlug)?.emoji ?? '📦'}</Text>}
        </View>
        <View style={{ padding: spacing[3] }}>
          <Text numberOfLines={2} style={{ color: t.text, fontWeight: '600', minHeight: 40 }}>{p.title}</Text>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{v.price}
            {v.original ? <Text style={{ color: t.textMuted, fontWeight: '400', fontSize: 12, textDecorationLine: 'line-through' }}>  {v.original}</Text> : null}
            {v.discount != null ? <Text style={{ color: t.accent, fontSize: 12 }}>  {v.discount}% off</Text> : null}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>{conditionLabel(p.condition)} · {p.city} · {relativeTime(p.createdAt)}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={saved ? `Remove ${p.title} from wishlist` : `Save ${p.title} to wishlist`} accessibilityState={{ selected: saved }}
        onPress={() => toggle(p.id)} style={[s.heart, { backgroundColor: t.surface }]} hitSlop={4}>
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? t.danger : t.text} />
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  card: { flex: 1, margin: spacing[1], borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  ph: { aspectRatio: 4 / 5, alignItems: 'center', justifyContent: 'center' }, img: { width: '100%', height: '100%' },
  heart: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2 },
});
