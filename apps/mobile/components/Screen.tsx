import { ScrollView, View } from 'react-native';
import { useTheme } from '@/lib/theme';
export default function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  return scroll
    ? <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={{ flex: 1, backgroundColor: t.background }}>{children}</View>;
}
