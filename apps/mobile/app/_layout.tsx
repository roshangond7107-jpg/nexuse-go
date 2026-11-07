import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { WishlistProvider } from '@/lib/wishlist';
import { useTheme } from '@/lib/theme';
import OfflineBanner from '@/components/OfflineBanner';

export default function RootLayout() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <WishlistProvider>
        <StatusBar style="light" backgroundColor={t.primary} />
        <View style={{ flex: 1, backgroundColor: t.background }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerStyle: { backgroundColor: t.primary }, headerTintColor: t.onPrimary, headerTitleStyle: { fontWeight: '800' }, contentStyle: { backgroundColor: t.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ title: 'Search' }} />
            <Stack.Screen name="category/[slug]" options={{ title: 'Category' }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Listing' }} />
          </Stack>
        </View>
      </WishlistProvider>
    </SafeAreaProvider>
  );
}
