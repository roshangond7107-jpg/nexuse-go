import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme, spacing, radii } from '@/lib/theme';
import type { ReactNode } from 'react';

export function Button({ label, onPress, variant = 'solid', disabled, accessibilityHint }: { label: string; onPress?: () => void; variant?: 'solid' | 'outline'; disabled?: boolean; accessibilityHint?: string }) {
  const t = useTheme();
  const solid = variant === 'solid';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: solid ? t.primary : 'transparent', borderColor: t.primary, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
      <Text style={{ color: solid ? t.onPrimary : t.primary, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const t = useTheme();
  return <View accessibilityRole="alert" style={[s.notice, { backgroundColor: t.surfaceMuted, borderLeftColor: tone === 'warn' ? t.danger : t.accent }]}><Text style={{ color: t.text }}>{children}</Text></View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.lg, padding: spacing[4] }, style]}>{children}</View>;
}

export function Heading({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ color: t.text, fontSize: level === 1 ? 26 : 19, fontWeight: '800', marginBottom: spacing[2] }}>{children}</Text>;
}
export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const t = useTheme();
  return <Text style={{ color: muted ? t.textMuted : t.text, fontSize: 15, lineHeight: 22 }}>{children}</Text>;
}

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingHorizontal: 18, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { padding: spacing[3], borderRadius: radii.md, borderLeftWidth: 4, marginVertical: spacing[3] },
});
