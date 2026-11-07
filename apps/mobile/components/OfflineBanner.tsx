import { Text, View } from 'react-native';
import { useOnline } from '@/lib/useOnline';
export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ backgroundColor: '#FFF3CD', padding: 8 }}><Text style={{ color: '#4A3500', textAlign: 'center', fontWeight: '600' }}>You are offline. Saved wishlist items are still available; browsing needs a connection.</Text></View>;
}
