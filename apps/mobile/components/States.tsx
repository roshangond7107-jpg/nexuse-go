import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ErrorKind } from '@nexuse/catalog';
import { Button } from './ui';
import { useTheme, spacing, radii } from '@/lib/theme';

const ICON: Record<ErrorKind, string> = { offline: '📡', unavailable: '🛠️', not_found: '🔎', unknown: '⚠️' };
const TITLE: Record<ErrorKind, string> = { offline: 'You’re offline', unavailable: 'Listings aren’t live yet', not_found: 'Not found', unknown: 'Something went wrong' };

function Box({ icon, title, message, children, alert }: { icon: string; title: string; message?: string; children?: React.ReactNode; alert?: boolean }) {
  const t = useTheme();
  return (
    <View accessible accessibilityRole={alert ? 'alert' : undefined} accessibilityLabel={`${title}. ${message ?? ''}`}
      style={[s.box, { borderColor: alert ? t.danger : t.border, backgroundColor: t.surface }]}>
      <Text style={s.icon} importantForAccessibility="no">{icon}</Text>
      <Text style={[s.title, { color: t.text }]}>{title}</Text>
      {message ? <Text style={{ color: t.textMuted, textAlign: 'center', marginBottom: spacing[3] }}>{message}</Text> : null}
      {children}
    </View>
  );
}
export const EmptyState = ({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) => <Box icon="🗂️" title={title} message={message}>{children}</Box>;
export function ErrorState({ kind, message, onRetry }: { kind: ErrorKind; message: string; onRetry?: () => void }) {
  return <Box icon={ICON[kind]} title={TITLE[kind]} message={message} alert={kind !== 'unavailable'}>{onRetry && (kind === 'offline' || kind === 'unknown') ? <Button label="Try again" onPress={onRetry} /> : null}</Box>;
}
export function LoadingState({ label = 'Loading listings…' }: { label?: string }) {
  const t = useTheme();
  return <View accessible accessibilityLabel={label} accessibilityLiveRegion="polite" style={s.loading}><ActivityIndicator size="large" color={t.primary} /><Text style={{ color: t.textMuted, marginTop: spacing[2] }}>{label}</Text></View>;
}
const s = StyleSheet.create({
  box: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radii.lg, padding: spacing[5], alignItems: 'center', margin: spacing[4] },
  icon: { fontSize: 36, marginBottom: spacing[2] }, title: { fontSize: 20, fontWeight: '800', marginBottom: spacing[2], textAlign: 'center' },
  loading: { padding: spacing[6], alignItems: 'center' },
});
