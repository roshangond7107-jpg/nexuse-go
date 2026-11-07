import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, radii } from '@/lib/theme';

export default function SearchBar({ initial = '', category }: { initial?: string; category?: string }) {
  const t = useTheme(); const [q, setQ] = useState(initial);
  const go = () => router.push({ pathname: '/search', params: { ...(q.trim() ? { q: q.trim() } : {}), ...(category ? { category } : {}) } });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, minHeight: 48 }}>
      <Ionicons name="search" size={20} color={t.textMuted} />
      <TextInput accessibilityLabel="Search study items" placeholder="Search books, calculators, notes…" placeholderTextColor={t.textMuted}
        value={q} onChangeText={setQ} onSubmitEditing={go} returnKeyType="search" maxLength={100} style={{ flex: 1, color: t.text, paddingHorizontal: 8, fontSize: 16, minHeight: 44 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={go} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}><Ionicons name="arrow-forward-circle" size={28} color={t.primary} /></Pressable>
    </View>
  );
}
