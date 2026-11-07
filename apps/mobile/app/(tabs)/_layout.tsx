import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const TAB = (title: string, icon: Icon, iconOff: Icon) => ({
  title, tabBarAccessibilityLabel: `${title} tab`,
  tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => <Ionicons name={focused ? icon : iconOff} size={size} color={color} />,
});

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: t.primary }, headerTintColor: t.onPrimary, headerTitleStyle: { fontWeight: '800' },
      tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.textMuted, tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, minHeight: 60 }, tabBarLabelStyle: { fontSize: 12 } }}>
      <Tabs.Screen name="index" options={{ ...TAB('Home', 'home', 'home-outline'), headerTitle: 'NEXUSE GO' }} />
      <Tabs.Screen name="categories" options={TAB('Categories', 'grid', 'grid-outline')} />
      <Tabs.Screen name="sell" options={TAB('Sell', 'add-circle', 'add-circle-outline')} />
      <Tabs.Screen name="wishlist" options={TAB('Wishlist', 'heart', 'heart-outline')} />
      <Tabs.Screen name="account" options={TAB('Account', 'person', 'person-outline')} />
    </Tabs>
  );
}
